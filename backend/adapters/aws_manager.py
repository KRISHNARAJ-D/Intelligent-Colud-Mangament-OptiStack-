import boto3
import logging
import datetime
import os

logger = logging.getLogger(__name__)

class AWSCloudManager:
    """
    Adapter layer to communicate with AWS Auto Scaling and CloudWatch
    for real-time metrics and dynamic horizontal scaling.
    """
    def __init__(self, region_name="us-east-1", asg_name="cloud-rl-asg"):
        self.region_name = region_name
        self.asg_name = asg_name
        
        # Initialize AWS SDK (Boto3) Clients
        # Relies on ~/.aws/credentials or AWS_ACCESS_KEY_ID in environment
        try:
            self.asg_client = boto3.client('autoscaling', region_name=self.region_name)
            self.cw_client = boto3.client('cloudwatch', region_name=self.region_name)
            logger.info(f"Connected to AWS in region {self.region_name}")
        except Exception as e:
            logger.error(f"Failed to connect to AWS: {e}")
            self.asg_client = None
            self.cw_client = None

    def get_active_instances(self):
        """Fetches the current 'DesiredCapacity' of the Auto Scaling Group."""
        if not self.asg_client:
            return 1
            
        try:
            response = self.asg_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[self.asg_name]
            )
            groups = response.get('AutoScalingGroups', [])
            if groups:
                return groups[0].get('DesiredCapacity', 1)
            return 1
        except Exception as e:
            logger.error(f"Error fetching ASG capacity: {e}")
            return 1

    def scale_deployment(self, replicas):
        """Updates the DesiredCapacity of the Auto Scaling Group."""
        if not self.asg_client:
            logger.warning(f"AWS ASG API not initialized. Would have scaled to {replicas}")
            return False

        try:
            # Implement a safety bound for production (Max EC2 instances)
            safe_replicas = max(1, min(replicas, 20))
            
            self.asg_client.set_desired_capacity(
                AutoScalingGroupName=self.asg_name,
                DesiredCapacity=safe_replicas,
                HonorCooldown=False
            )
            logger.info(f"Scaled AWS ASG '{self.asg_name}' to {safe_replicas} instances.")
            return True
        except Exception as e:
            logger.error(f"Failed to scale ASG: {e}")
            return False

    def get_real_metrics(self):
        """
        Queries AWS CloudWatch for real-time CPU and Request Metrics.
        """
        metrics = {
            "cpu_utilization": 0.1,
            "memory_usage": 0.2, # Memory is not natively in CloudWatch without the CloudWatch Agent
            "request_rate": 50.0
        }
        
        if not self.cw_client:
            return metrics

        # CloudWatch metrics are typically delayed by ~1-5 minutes
        # We query the average over the last 5 minutes
        end_time = datetime.datetime.utcnow()
        start_time = end_time - datetime.timedelta(minutes=5)

        try:
            # 1. Fetch Average CPU Utilization across the ASG
            cpu_response = self.cw_client.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName='CPUUtilization',
                Dimensions=[{'Name': 'AutoScalingGroupName', 'Value': self.asg_name}],
                StartTime=start_time,
                EndTime=end_time,
                Period=60,
                Statistics=['Average']
            )
            datapoints = cpu_response.get('Datapoints', [])
            if datapoints:
                # Sort by timestamp to get the latest
                latest = sorted(datapoints, key=lambda x: x['Timestamp'])[-1]
                # CloudWatch CPU is 0-100%, we normalize to 0.0-1.0
                metrics['cpu_utilization'] = min(1.0, float(latest['Average']) / 100.0)

            # 2. Fetch Request Rate (Assuming an Application Load Balancer is attached)
            # You would need the ALB Target Group ARN suffix here, e.g. 'targetgroup/my-tg/1234'
            alb_tg_id = os.getenv("AWS_ALB_TG_ID")
            if alb_tg_id:
                req_response = self.cw_client.get_metric_statistics(
                    Namespace='AWS/ApplicationELB',
                    MetricName='RequestCount',
                    Dimensions=[{'Name': 'TargetGroup', 'Value': alb_tg_id}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=60,
                    Statistics=['Sum']
                )
                req_datapoints = req_response.get('Datapoints', [])
                if req_datapoints:
                    latest_req = sorted(req_datapoints, key=lambda x: x['Timestamp'])[-1]
                    # Convert Sum over 60 seconds to Requests Per Second
                    metrics['request_rate'] = float(latest_req['Sum']) / 60.0

        except Exception as e:
            logger.warning(f"AWS CloudWatch metric fetch failed: {e}")
            
        return metrics

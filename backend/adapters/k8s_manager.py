from kubernetes import client, config
from prometheus_api_client import PrometheusConnect
import os
import logging

logger = logging.getLogger(__name__)

class K8sManager:
    """
    Adapter layer to communicate with Kubernetes and Prometheus 
    for real-time metrics and dynamic horizontal scaling.
    """
    def __init__(self, prometheus_url="http://prometheus:9090", namespace="default", deployment_name="app-backend"):
        self.namespace = namespace
        self.deployment_name = deployment_name
        
        # Initialize Kubernetes Client
        try:
            # Tries to load in-cluster config first (if running inside a pod),
            # otherwise falls back to local ~/.kube/config
            if 'KUBERNETES_PORT' in os.environ:
                config.load_incluster_config()
            else:
                config.load_kube_config()
            self.api = client.AppsV1Api()
            logger.info("Connected to Kubernetes Cluster.")
        except Exception as e:
            logger.error(f"Failed to connect to Kubernetes: {e}")
            self.api = None

        # Initialize Prometheus Client
        try:
            self.prom = PrometheusConnect(url=prometheus_url, disable_ssl=True)
            logger.info(f"Connected to Prometheus at {prometheus_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Prometheus: {e}")
            self.prom = None

    def get_active_instances(self):
        """Fetches the current number of ready replicas for the deployment."""
        if not self.api:
            return 1
            
        try:
            deployment = self.api.read_namespaced_deployment(self.deployment_name, self.namespace)
            return deployment.status.ready_replicas or 0
        except Exception as e:
            logger.error(f"Error fetching replicas: {e}")
            return 1

    def scale_deployment(self, replicas):
        """Patches the deployment to the desired replica count."""
        if not self.api:
            logger.warning(f"K8s API not initialized. Would have scaled to {replicas}")
            return False

        try:
            # Implement a safety bound for production
            safe_replicas = max(1, min(replicas, 20))
            
            body = {"spec": {"replicas": safe_replicas}}
            self.api.patch_namespaced_deployment_scale(
                name=self.deployment_name, 
                namespace=self.namespace, 
                body=body
            )
            logger.info(f"Scaled {self.deployment_name} to {safe_replicas} replicas.")
            return True
        except Exception as e:
            logger.error(f"Failed to scale deployment: {e}")
            return False

    def get_real_metrics(self):
        """
        Queries Prometheus for real-time CPU, Memory, and Request Rate.
        Fallbacks to dummy data if Prometheus isn't reachable (for testing).
        """
        metrics = {
            "cpu_utilization": 0.1,
            "memory_usage": 0.2,
            "request_rate": 50.0
        }
        
        if not self.prom:
            return metrics

        try:
            # Query avg CPU utilization across the deployment pods over the last 1m
            cpu_query = f'avg(rate(container_cpu_usage_seconds_total{{namespace="{self.namespace}", pod=~"{self.deployment_name}-.*"}}[1m]))'
            cpu_result = self.prom.custom_query(query=cpu_query)
            if cpu_result:
                metrics['cpu_utilization'] = float(cpu_result[0]['value'][1])

            # Query avg Memory usage
            mem_query = f'avg(container_memory_working_set_bytes{{namespace="{self.namespace}", pod=~"{self.deployment_name}-.*"}})'
            mem_result = self.prom.custom_query(query=mem_query)
            if mem_result:
                # Normalize out of a hypothetical 1GB limit for percentages
                val_bytes = float(mem_result[0]['value'][1])
                metrics['memory_usage'] = min(1.0, val_bytes / (1024 * 1024 * 1024))
                
            # Query incoming request rate (assuming a service metric exists, e.g. nginx ingress or similar)
            req_query = f'sum(rate(http_requests_total{{namespace="{self.namespace}"}}[1m]))'
            req_result = self.prom.custom_query(query=req_query)
            if req_result:
                metrics['request_rate'] = float(req_result[0]['value'][1])
                
        except Exception as e:
            logger.warning(f"Prometheus metric fetch failed: {e}")
            
        return metrics

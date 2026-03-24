# Isaac ROS

## GPU-Accelerated Perception

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Install and configure Isaac ROS packages
- Use GPU-accelerated perception nodes
- Implement real-time object detection
- Build SLAM pipelines with CUDA acceleration
- Deploy perception pipelines to Jetson

---

### What is Isaac ROS?

**Isaac ROS** is a collection of GPU-accelerated ROS 2 packages for robotics perception:

```
┌─────────────────────────────────────────────────────────┐
│                  Isaac ROS Libraries                     │
├─────────────────────────────────────────────────────────┤
│  isaac_ros_bi3d     │ Stereo depth perception          │
│  isaac_ros_core     │ Core infrastructure              │
│  isaac_ros_dnn      │ Deep learning inference          │
│  isaac_ros_foundationpose │ 6-DOF object pose tracking │
│  isaac_ros_gxf      │ Graph execution framework        │
│  isaac_ros_nitros   │ NVIDIA IO message format         │
│  isaac_ros_slam     │ Visual SLAM                      │
│  isaac_ros_tensorrt │ TensorRT optimization            │
└─────────────────────────────────────────────────────────┘
```

**Why GPU acceleration matters:**
- **10-100x faster** than CPU for vision tasks
- **Real-time performance** at high resolutions
- **Lower latency** for control loops
- **Power efficient** on Jetson platforms

---

### Installing Isaac ROS

#### Prerequisites

```bash
# Install CUDA toolkit (if not already installed)
sudo apt install cuda-toolkit-12-2

# Install cuDNN
sudo apt install libcudnn8

# Install TensorRT
sudo apt install tensorrt
```

#### Install Isaac ROS Packages

```bash
# Create workspace
mkdir -p ~/isaac_ros_ws/src
cd ~/isaac_ros_ws/src

# Clone Isaac ROS repositories
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_common.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_bi3d.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_depth_image_proc.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_foundationpose.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_nitros.git
git clone https://github.com/NVIDIA-ISAAC-ROS/isaac_ros_tensorrt.git

# Install dependencies
cd ~/isaac_ros_ws
rosdep install -i --from-path src --rosdistro humble -y

# Build
colcon build --symlink-install

# Source workspace
source install/setup.bash
```

#### Docker Installation (Recommended)

```bash
# Pull Isaac ROS container
docker pull nvcr.io/nvidia/isaac/ros2_humble:1.0

# Run with GPU support
docker run --gpus all -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  nvcr.io/nvidia/isaac/ros2_humble:1.0
```

---

### NITROS: NVIDIA Optimized Message Format

**NITROS** (NVIDIA IO Message Format) optimizes data transfer:

| Standard ROS 2 | NITROS |
|----------------|--------|
| CPU memory copy | Zero-copy GPU |
| Serialization overhead | Direct memory access |
| 10-50 ms latency | {'<'}1 ms latency |

#### Using NITROS Types

```python
from isaac_ros_nitros import NitrosImage
from sensor_msgs.msg import Image

# Traditional ROS 2 image (slow)
def image_callback(msg: Image):
    # Copy to GPU for processing
    gpu_image = copy_to_gpu(msg.data)
    process(gpu_image)

# NITROS image (fast)
def nitros_callback(msg: NitrosImage):
    # Already on GPU, process directly
    process(msg.gpu_data)
```

---

### Stereo Depth Perception

#### Bi3D Node (Bilateral 3D)

Real-time stereo depth estimation:

```python
# stereo_depth_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Stereo image input
        Node(
            package='isaac_ros_bi3d',
            executable='isaac_ros_bi3d_node',
            name='bi3d_node',
            parameters=[{
                'input_width': 960,
                'input_height': 540,
                'max_disparity': 128,
                'disparity_mode': 'accurate',
                'use_cuda': True
            }],
            remappings=[
                ('left/image', '/stereo/left/image_raw'),
                ('right/image', '/stereo/right/image_raw'),
                ('depth', '/depth/image_raw')
            ]
        ),
        
        # Point cloud generation
        Node(
            package='isaac_ros_depth_image_proc',
            executable='depth_image_proc',
            name='depth_image_proc',
            remappings=[
                ('image_rect', '/depth/image_raw'),
                ('camera_info', '/depth/camera_info'),
                ('points', '/depth/points')
            ]
        )
    ])
```

#### Running Stereo Depth

```bash
# Launch stereo depth pipeline
ros2 launch stereo_depth_launch.py

# View depth image
ros2 run rqt_image_view rqt_image_view /depth/image_raw

# View point cloud in RViz
rviz2
# Add → PointCloud2
# Topic: /depth/points
```

---

### Object Detection with TensorRT

#### YOLO with TensorRT Acceleration

```python
# object_detection_node.py
import rclpy
from rclpy.node import Node
from isaac_ros_tensorrt import TensorRTNode
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray

class ObjectDetectionNode(Node):
    def __init__(self):
        super().__init__('object_detection_node')
        
        # Load TensorRT engine (pre-optimized YOLO model)
        self.trt_node = TensorRTNode(
            engine_path='/path/to/yolo.engine',
            input_binding='input',
            output_binding='output'
        )
        
        self.subscription = self.create_subscription(
            Image, '/camera/image_raw', self.image_callback, 10
        )
        
        self.detection_pub = self.create_publisher(
            Detection2DArray, '/detections', 10
        )
    
    def image_callback(self, msg):
        # Preprocess image on GPU
        gpu_image = self.preprocess(msg)
        
        # Run inference
        detections = self.trt_node.infer(gpu_image)
        
        # Post-process and publish
        detection_msg = self.parse_detections(detections)
        self.detection_pub.publish(detection_msg)
    
    def preprocess(self, msg):
        # Resize, normalize on GPU
        # Implementation depends on CUDA setup
        pass
    
    def parse_detections(self, detections):
        # Convert raw output to ROS 2 message
        msg = Detection2DArray()
        msg.header.stamp = self.get_clock().now().to_msg()
        
        for det in detections:
            detection = det  # Parse bounding box, class, score
            msg.detections.append(detection)
        
        return msg

def main(args=None):
    rclpy.init(args=args)
    node = ObjectDetectionNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

#### Creating TensorRT Engine

```bash
# Convert ONNX model to TensorRT engine
trtexec --onnx=yolo.onnx \
  --saveEngine=yolo.engine \
  --fp16 \
  --workspace=4096 \
  --batch=1
```

---

### Visual SLAM with CUDA

#### Isaac ROS SLAM

Real-time visual SLAM with GPU acceleration:

```python
# slam_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        # Visual SLAM node
        Node(
            package='isaac_ros_slam',
            executable='isaac_ros_slam_node',
            name='visual_slam',
            parameters=[{
                'use_gpu': True,
                'enable_localization': True,
                'enable_mapping': True,
                'map_resolution': 0.05,
                'odometry_frame': 'odom',
                'map_frame': 'map',
                'base_frame': 'base_link'
            }],
            remappings=[
                ('image_left', '/camera/left/image_raw'),
                ('image_right', '/camera/right/image_raw'),
                ('camera_info_left', '/camera/left/camera_info'),
                ('camera_info_right', '/camera/right/camera_info')
            ]
        ),
        
        # Map server (for saved maps)
        Node(
            package='map_server',
            executable='map_server',
            name='map_server',
            parameters=[{
                'yaml_filename': '/path/to/map.yaml'
            }]
        ),
        
        # AMCL for localization
        Node(
            package='nav2_amcl',
            executable='amcl',
            name='amcl'
        )
    ])
```

#### Running SLAM

```bash
# Launch SLAM
ros2 launch slam_launch.py

# View map in RViz
rviz2
# Add → Map
# Topic: /map

# Save map after exploration
ros2 run nav2_map_server map_saver_cli -f my_map
```

---

### 6-DOF Object Pose Tracking

FoundationPose for object pose estimation:

```python
# pose_tracking_node.py
import rclpy
from rclpy.node import Node
from isaac_ros_foundationpose import FoundationPoseNode
from geometry_msgs.msg import PoseStamped

class PoseTrackingNode(Node):
    def __init__(self):
        super().__init__('pose_tracking_node')
        
        # Initialize FoundationPose
        self.pose_node = FoundationPoseNode(
            model_path='/path/to/object_model.usd',
            use_gpu=True
        )
        
        self.subscription = self.create_subscription(
            Image, '/camera/depth/image_raw', self.depth_callback, 10
        )
        
        self.pose_pub = self.create_publisher(
            PoseStamped, '/object_pose', 10
        )
    
    def depth_callback(self, msg):
        # Get depth image and camera info
        depth_image = self.convert_to_numpy(msg)
        
        # Run pose estimation
        pose = self.pose_node.estimate_pose(depth_image)
        
        # Publish pose
        pose_msg = PoseStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = 'camera_link'
        pose_msg.pose = pose
        self.pose_pub.publish(pose_msg)
        
        self.get_logger().info(f'Object pose: {pose}')

def main(args=None):
    rclpy.init(args=args)
    node = PoseTrackingNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Multi-Camera Fusion

Fuse multiple cameras for 360° perception:

```python
# multi_camera_fusion.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from message_filters import Subscriber, ApproximateTimeSynchronizer

class MultiCameraFusion(Node):
    def __init__(self):
        super().__init__('multi_camera_fusion')
        
        # Subscribe to multiple cameras
        self.front_sub = Subscriber(self, Image, '/camera/front/image_raw')
        self.left_sub = Subscriber(self, Image, '/camera/left/image_raw')
        self.right_sub = Subscriber(self, Image, '/camera/right/image_raw')
        self.back_sub = Subscriber(self, Image, '/camera/back/image_raw')
        
        # Synchronize messages
        self.ts = ApproximateTimeSynchronizer(
            [self.front_sub, self.left_sub, self.right_sub, self.back_sub],
            queue_size=10,
            slop=0.1
        )
        self.ts.registerCallback(self.fusion_callback)
        
        self.fused_pub = self.create_publisher(
            Image, '/camera/fused/panorama', 10
        )
    
    def fusion_callback(self, front, left, right, back):
        # Stitch images into panorama
        panorama = self.stitch_images(front, left, right, back)
        
        # Publish fused image
        self.fused_pub.publish(panorama)
    
    def stitch_images(self, *images):
        # GPU-accelerated image stitching
        # Implementation using OpenCV CUDA
        pass

def main(args=None):
    rclpy.init(args=args)
    node = MultiCameraFusion()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Deploying to Jetson

#### Jetson Orin Setup

```bash
# Flash Jetson with JetPack 5.1+
# Download from: https://developer.nvidia.com/embedded/jetpack

# Install Isaac ROS on Jetson
sudo apt install ros-humble-isaac-ros-*

# Verify GPU access
tegrastats  # Should show GPU utilization
```

#### Optimize for Edge

```python
# edge_optimization.py
import torch
import tensorrt as trt

def optimize_for_jetson(model_path):
    """Optimize model for Jetson Orin"""
    
    # Load PyTorch model
    model = torch.load(model_path)
    model.eval()
    
    # Convert to ONNX
    dummy_input = torch.randn(1, 3, 640, 640).cuda()
    torch.onnx.export(
        model,
        dummy_input,
        'model.onnx',
        input_names=['input'],
        output_names=['output']
    )
    
    # Build TensorRT engine for Jetson
    logger = trt.Logger(trt.Logger.INFO)
    builder = trt.Builder(logger)
    network = builder.create_network(
        1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
    )
    parser = trt.OnnxParser(network, logger)
    
    with open('model.onnx', 'rb') as f:
        parser.parse(f.read())
    
    # Configure for Jetson
    config = builder.create_builder_config()
    config.max_workspace_size = 4 << 30  # 4GB
    config.set_flag(trt.BuilderFlag.FP16)  # Mixed precision
    
    # Build engine
    engine = builder.build_serialized_network(network, config)
    
    with open('model_jetson.engine', 'wb') as f:
        f.write(engine)
    
    print("Optimized for Jetson Orin!")
```

---

### Performance Benchmarks

| Task | CPU (ms) | GPU (ms) | Speedup |
|------|----------|----------|---------|
| Stereo Depth | 150 | 15 | 10x |
| YOLO Detection | 200 | 10 | 20x |
| Visual SLAM | 100 | 20 | 5x |
| Pose Estimation | 300 | 25 | 12x |

---

### Summary

You've learned:
- ✅ Isaac ROS installation and configuration
- ✅ NITROS for zero-copy GPU messaging
- ✅ Stereo depth perception
- ✅ TensorRT-accelerated object detection
- ✅ Visual SLAM with CUDA
- ✅ 6-DOF pose tracking
- ✅ Multi-camera fusion
- ✅ Jetson deployment optimization

---

### Exercises

1. **Install Isaac ROS** and run the Bi3D node
2. **Optimize a YOLO model** with TensorRT
3. **Build a SLAM pipeline** with GPU acceleration
4. **Deploy to Jetson** (or simulate with Docker)

---

### What's Next?

In the next chapter, you'll learn **Nav2 for Humanoids**—adapting the navigation stack for bipedal locomotion.

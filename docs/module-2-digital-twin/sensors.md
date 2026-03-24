# Sensor Simulation

## Modeling Perception Systems

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Understand different sensor types for humanoid robots
- Configure camera simulation with realistic noise
- Simulate LiDAR point clouds
- Model IMU and force-torque sensors
- Generate synthetic training data

---

### Why Sensor Simulation Matters

Humanoid robots rely on sensors to perceive the world:

```
┌─────────────────────────────────────────────────────┐
│              Humanoid Perception Stack              │
├─────────────────────────────────────────────────────┤
│  Vision        │  Cameras, Depth sensors, Event     │
│  Proprioception│  IMU, Encoders, Force-torque       │
│  Tactile       │  Touch sensors, Pressure arrays    │
│  Audio         │  Microphones, Acoustic arrays      │
└─────────────────────────────────────────────────────┘
```

**Simulation benefits:**
- Test perception algorithms without hardware
- Generate labeled data for ML training
- Inject faults and edge cases safely
- Validate sensor fusion approaches

---

### Camera Simulation

#### Types of Simulated Cameras

| Type | Output | Use Case |
|------|--------|----------|
| RGB | Color image | Object detection, navigation |
| Depth | Distance map | 3D reconstruction, avoidance |
| Segmentation | Class labels | Scene understanding |
| Normal | Surface normals | Grasping, manipulation |
| Optical Flow | Motion vectors | Visual odometry |

#### Gazebo Camera Configuration

Add an RGB-D camera to your humanoid's head:

```xml
<link name="head_camera_link">
  <visual>
    <geometry>
      <box size="0.05 0.02 0.02"/>
    </geometry>
  </visual>
  
  <collision>
    <geometry>
      <box size="0.05 0.02 0.02"/>
    </geometry>
  </collision>
  
  <inertial>
    <mass value="0.1"/>
    <inertia ixx="0.0001" ixy="0" ixz="0" iyy="0.0001" iyz="0" izz="0.0001"/>
  </inertial>
  
  <!-- Camera sensor -->
  <sensor name="head_camera" type="depth">
    <pose>0 0 0 0 0 0</pose>
    <camera name="camera">
      <horizontal_fov>1.047</horizontal_fov>  <!-- 60 degrees -->
      <image>
        <width>640</width>
        <height>480</height>
        <format>R_FLOAT32</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>10.0</far>
      </clip>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.005</stddev>
      </noise>
    </camera>
    
    <always_on>true</always_on>
    <update_rate>30</update_rate>
    <visualize>true</visualize>
    
    <!-- ROS 2 plugin -->
    <plugin name="camera_plugin" filename="libgazebo_ros_camera.so">
      <ros>
        <namespace>/camera</namespace>
        <remapping>image_raw:=depth/image_raw</remapping>
        <remapping>camera_info:=depth/camera_info</remapping>
      </ros>
      <camera_name>head_camera</camera_name>
      <frame_name>head_camera_link</frame_name>
      <hack_baseline>0.07</hack_baseline>
    </plugin>
  </sensor>
</link>

<joint name="head_camera_joint" type="fixed">
  <parent link="head_link"/>
  <child link="head_camera_link"/>
  <origin xyz="0.05 0 0.05" rpy="0 0.3 0"/>  <!-- Tilted down slightly -->
</joint>
```

#### Viewing Camera Output

```bash
# View RGB image
ros2 run rqt_image_view rqt_image_view /camera/image_raw

# View depth image
ros2 run rqt_image_view rqt_image_view /camera/depth/image_raw

# Get camera info
ros2 topic echo /camera/camera_info
```

---

### LiDAR Simulation

#### 2D vs 3D LiDAR

| Type | Beams | Use Case |
|------|-------|----------|
| 2D LiDAR | Single plane (180-360°) | Navigation, obstacle avoidance |
| 3D LiDAR | Multiple planes (full sphere) | 3D mapping, SLAM |

#### Gazebo LiDAR Configuration

Add a 3D LiDAR to your humanoid's chest:

```xml
<link name="lidar_link">
  <visual>
    <geometry>
      <cylinder radius="0.05" length="0.05"/>
    </geometry>
  </visual>
  
  <sensor name="lidar" type="ray">
    <pose>0 0 0 0 0 0</pose>
    <ray>
      <scan>
        <horizontal>
          <samples>720</samples>    <!-- 0.5° resolution -->
          <resolution>1.0</resolution>
          <min_angle>-3.14159</min_angle>  <!-- -180° -->
          <max_angle>3.14159</max_angle>   <!-- +180° -->
        </horizontal>
        <vertical>
          <samples>16</samples>     <!-- 16 layers -->
          <resolution>1.0</resolution>
          <min_angle>-0.261799</min_angle>  <!-- -15° -->
          <max_angle>0.261799</max_angle>   <!-- +15° -->
        </vertical>
      </scan>
      <range>
        <min>0.1</min>
        <max>30.0</max>
        <resolution>0.01</resolution>
      </range>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.01</stddev>
      </noise>
    </ray>
    
    <always_on>true</always_on>
    <update_rate>10</update_rate>
    <visualize>true</visualize>
    
    <!-- ROS 2 plugin for point cloud -->
    <plugin name="lidar_plugin" filename="libgazebo_ros_ray_sensor.so">
      <ros>
        <namespace>/lidar</namespace>
        <remapping>~/out:=points</remapping>
      </ros>
      <output_type>sensor_msgs/PointCloud2</output_type>
      <frame_name>lidar_link</frame_name>
    </plugin>
  </sensor>
</link>

<joint name="lidar_joint" type="fixed">
  <parent link="torso_link"/>
  <child link="lidar_link"/>
  <origin xyz="0 0 0.15" rpy="0 0 0"/>
</joint>
```

#### Visualizing Point Clouds

```bash
# View in RViz
rviz2
# Add → PointCloud2
# Topic: /lidar/points

# View statistics
ros2 topic echo /lidar/points --no-arr
```

---

### IMU Simulation

#### What is an IMU?

An **Inertial Measurement Unit (IMU)** measures:
- **Linear acceleration** (3-axis accelerometer)
- **Angular velocity** (3-axis gyroscope)
- **Orientation** (3-axis magnetometer, optional)

**Critical for humanoids:** Balance, state estimation, fall detection

#### Gazebo IMU Configuration

```xml
<link name="imu_link">
  <inertial>
    <mass value="0.01"/>
    <inertia ixx="0.000001" ixy="0" ixz="0" iyy="0.000001" iyz="0" izz="0.000001"/>
  </inertial>
</link>

<joint name="imu_joint" type="fixed">
  <parent link="torso_link"/>
  <child link="imu_link"/>
  <origin xyz="0 0 0" rpy="0 0 0"/>
</joint>

<gazebo reference="imu_link">
  <sensor name="imu_sensor" type="imu">
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    <visualize>true</visualize>
    
    <plugin name="imu_plugin" filename="libgazebo_ros_imu_sensor.so">
      <ros>
        <namespace>/imu</namespace>
        <remapping>~/out:=data</remapping>
      </ros>
      <initial_orientation_as_reference>false</initial_orientation_as_reference>
      
      <!-- Noise parameters for realistic simulation -->
      <imu>
        <angular_velocity>
          <x>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.001</stddev>
            </noise>
          </x>
          <y>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.001</stddev>
            </noise>
          </y>
          <z>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.001</stddev>
            </noise>
          </z>
        </angular_velocity>
        <linear_acceleration>
          <x>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.01</stddev>
            </noise>
          </x>
          <y>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.01</stddev>
            </noise>
          </y>
          <z>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>0.01</stddev>
            </noise>
          </z>
        </linear_acceleration>
      </imu>
    </plugin>
  </sensor>
</gazebo>
```

#### Using IMU Data

```python
# imu_listener.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu
import math

class ImuListener(Node):
    def __init__(self):
        super().__init__('imu_listener')
        self.subscription = self.create_subscription(
            Imu, '/imu/data', self.imu_callback, 10
        )
    
    def imu_callback(self, msg):
        # Extract orientation (quaternion)
        orientation = msg.orientation
        roll, pitch, yaw = self.quaternion_to_euler(
            orientation.x, orientation.y, orientation.z, orientation.w
        )
        
        # Extract acceleration
        accel = msg.linear_acceleration
        
        # Extract angular velocity
        gyro = msg.angular_velocity
        
        self.get_logger().info(
            f'Roll: {math.degrees(roll):.1f}°, '
            f'Pitch: {math.degrees(pitch):.1f}°, '
            f'Yaw: {math.degrees(yaw):.1f}°'
        )
    
    def quaternion_to_euler(self, x, y, z, w):
        # Convert quaternion to Euler angles
        t0 = 2.0 * (w * x + y * z)
        t1 = 1.0 - 2.0 * (x * x + y * y)
        roll = math.atan2(t0, t1)
        
        t2 = 2.0 * (w * y - z * x)
        t2 = 1.0 if t2 > 1.0 else t2
        t2 = -1.0 if t2 < -1.0 else t2
        pitch = math.asin(t2)
        
        t3 = 2.0 * (w * z + x * y)
        t4 = 1.0 - 2.0 * (y * y + z * z)
        yaw = math.atan2(t3, t4)
        
        return roll, pitch, yaw

def main(args=None):
    rclpy.init(args=args)
    node = ImuListener()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Force-Torque Sensor Simulation

#### Purpose in Humanoids

Force-torque sensors measure:
- **Force** (3-axis): Push/pull in x, y, z
- **Torque** (3-axis): Rotation around x, y, z

**Applications:**
- Foot contact detection for walking
- Grasping force control
- Collision detection
- Impedance control

#### Gazebo Contact Sensor Configuration

```xml
<link name="left_foot_link">
  <!-- ... visual and collision geometry ... -->
  
  <sensor name="left_foot_contact" type="contact">
    <contact>
      <collision>left_foot_link_collision</collision>
    </contact>
    
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    
    <plugin name="contact_plugin" filename="libgazebo_ros_contact_sensor.so">
      <ros>
        <namespace>/sensors</namespace>
        <remapping>~/out:=left_foot_contact</remapping>
      </ros>
      <frame_name>left_foot_link</frame_name>
    </plugin>
  </sensor>
</link>
```

#### Force-Torque Plugin (Alternative)

For ankle-mounted FT sensors:

```xml
<joint name="left_ankle_joint">
  <!-- ... joint definition ... -->
  
  <sensor name="left_ankle_ft" type="force_torque">
    <force_torque>
      <frame>child</frame>
      <measure_direction>child_to_parent</measure_direction>
    </force_torque>
    
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    
    <plugin name="ft_sensor_plugin" filename="libgazebo_ros_ft_sensor.so">
      <ros>
        <namespace>/sensors</namespace>
        <remapping>~/out:=left_ankle_ft</remapping>
      </ros>
      <joint_name>left_ankle_joint</joint_name>
    </plugin>
  </sensor>
</joint>
```

#### Processing Contact Data

```python
# foot_contact_listener.py
import rclpy
from rclpy.node import Node
from rosgraph_msgs.msg import ContactState

class FootContactListener(Node):
    def __init__(self):
        super().__init__('foot_contact_listener')
        
        self.left_sub = self.create_subscription(
            ContactState, '/sensors/left_foot_contact', 
            self.left_callback, 10
        )
        self.right_sub = self.create_subscription(
            ContactState, '/sensors/right_foot_contact', 
            self.right_callback, 10
        )
    
    def left_callback(self, msg):
        if msg.collision_depths:
            total_force = sum(msg.collision_depths)
            if total_force > 0.01:  # Threshold
                self.get_logger().info(f'Left foot contact: {total_force:.3f}m')
    
    def right_callback(self, msg):
        if msg.collision_depths:
            total_force = sum(msg.collision_depths)
            if total_force > 0.01:
                self.get_logger().info(f'Right foot contact: {total_force:.3f}m')

def main(args=None):
    rclpy.init(args=args)
    node = FootContactListener()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Generating Synthetic Training Data

#### Why Synthetic Data?

Training perception models requires labeled data:
- **Real data**: Expensive, time-consuming to label
- **Synthetic data**: Free, automatically labeled, infinite variations

#### Domain Randomization

Vary simulation parameters to improve robustness:

```python
# domain_randomizer.py
import random
import rclpy
from rclpy.node import Node

class DomainRandomizer(Node):
    def __init__(self):
        super().__init__('domain_randomizer')
        self.timer = self.create_timer(5.0, self.randomize)
    
    def randomize(self):
        # Randomize lighting
        light_intensity = random.uniform(0.5, 1.5)
        self.set_param('/gazebo/light/intensity', light_intensity)
        
        # Randomize friction
        friction = random.uniform(0.3, 1.2)
        self.set_param('/gazebo/ground/friction', friction)
        
        # Randomize camera noise
        noise_std = random.uniform(0.0, 0.02)
        self.set_param('/camera/noise/stddev', noise_std)
        
        self.get_logger().info('Domain parameters randomized')
    
    def set_param(self, param_name, value):
        # Use Gazebo services to update parameters
        pass

def main(args=None):
    rclpy.init(args=args)
    node = DomainRandomizer()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

#### Data Collection Pipeline

```python
# data_collector.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, PointCloud2
import cv2
import numpy as np
from cv_bridge import CvBridge

class DataCollector(Node):
    def __init__(self):
        super().__init__('data_collector')
        self.bridge = CvBridge()
        
        self.image_sub = self.create_subscription(
            Image, '/camera/image_raw', self.image_callback, 10
        )
        self.depth_sub = self.create_subscription(
            Image, '/camera/depth/image_raw', self.depth_callback, 10
        )
        
        self.frame_count = 0
    
    def image_callback(self, msg):
        cv_image = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        
        # Save image
        filename = f'data/rgb_{self.frame_count:05d}.png'
        cv2.imwrite(filename, cv_image)
        
        self.get_logger().info(f'Saved {filename}')
    
    def depth_callback(self, msg):
        depth_image = self.bridge.imgmsg_to_cv2(msg, '32FC1')
        
        # Save depth
        filename = f'data/depth_{self.frame_count:05d}.npy'
        np.save(filename, depth_image)
        
        self.frame_count += 1

def main(args=None):
    rclpy.init(args=args)
    node = DataCollector()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Sensor Fusion in Simulation

Combine multiple sensors for robust perception:

```python
# sensor_fusion_node.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu, JointState
from geometry_msgs.msg import PoseStamped
import tf2_ros
import math

class SensorFusion(Node):
    def __init__(self):
        super().__init__('sensor_fusion')
        
        self.imu_sub = self.create_subscription(
            Imu, '/imu/data', self.imu_callback, 10
        )
        self.joint_sub = self.create_subscription(
            JointState, '/joint_states', self.joint_callback, 10
        )
        
        self.tf_broadcaster = tf2_ros.TransformBroadcaster(self)
        
        self.latest_imu = None
        self.latest_joints = None
    
    def imu_callback(self, msg):
        self.latest_imu = msg
        self.publish_state()
    
    def joint_callback(self, msg):
        self.latest_joints = msg
        self.publish_state()
    
    def publish_state(self):
        if self.latest_imu is None or self.latest_joints is None:
            return
        
        # Combine IMU orientation with joint kinematics
        # to estimate full body pose
        
        pose_msg = PoseStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = 'odom'
        pose_msg.pose.position.x = 0.0
        pose_msg.pose.position.y = 0.0
        pose_msg.pose.position.z = 0.5
        pose_msg.pose.orientation = self.latest_imu.orientation
        
        self.get_logger().info('Fused state published')

def main(args=None):
    rclpy.init(args=args)
    node = SensorFusion()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Summary

You've learned:
- ✅ Camera simulation (RGB, depth, segmentation)
- ✅ LiDAR point cloud generation
- ✅ IMU modeling with realistic noise
- ✅ Force-torque and contact sensors
- ✅ Synthetic data generation pipelines
- ✅ Multi-sensor fusion approaches

---

### Exercises

1. **Add an RGB-D camera** to your humanoid and view the depth stream
2. **Implement obstacle detection** using LiDAR point clouds
3. **Create a balance controller** that uses IMU data
4. **Build a data collection pipeline** and generate 100 labeled images

---

### Module 2 Project

**Complete Digital Twin:**
1. Import your humanoid into Gazebo
2. Add camera, LiDAR, IMU, and foot sensors
3. Create a Unity scene for HRI testing
4. Collect synthetic training data
5. Demonstrate sensor fusion for state estimation

---

### What's Next?

In **Module 3: NVIDIA Isaac**, you'll learn to use industry-leading simulation and perception tools for advanced humanoid robotics development.

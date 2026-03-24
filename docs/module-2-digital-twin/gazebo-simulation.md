# Gazebo Simulation

## Physics-Based Robot Simulation

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Install and configure Gazebo for ROS 2
- Convert URDF for Gazebo simulation
- Add physics properties (friction, damping)
- Spawn and control your humanoid in simulation
- Use Gazebo plugins for sensors and actuators

---

### What is Gazebo?

**Gazebo** is an open-source 3D robotics simulator featuring:
- **Multiple physics engines** (ODE, Bullet, DART)
- **High-fidelity graphics** with lighting and shadows
- **Sensor simulation** (cameras, LiDAR, IMU, contact)
- **ROS 2 integration** for seamless control

**Gazebo Architecture:**
```
┌─────────────────────────────────────────┐
│            Gazebo Server                │
│  ┌───────────┐  ┌───────────┐          │
│  │  Physics  │  │  Rendering│          │
│  │  Engine   │  │  Engine   │          │
│  └───────────┘  └───────────┘          │
└─────────────────────────────────────────┘
              ▲         ▲
              │         │
       ROS 2  │         │  GUI
       Topics │         │  (Optional)
              │         │
┌─────────────┴─────────┴───────────────┐
│         Your ROS 2 Nodes              │
└───────────────────────────────────────┘
```

---

### Installing Gazebo for ROS 2

For ROS 2 Humble, install Gazebo Classic (gz-sim):

```bash
# Install Gazebo for ROS 2 Humble
sudo apt install ros-humble-gazebo-ros-pkgs

# Verify installation
gz sim --version
```

For newer projects, consider **Gazebo Sim** (formerly Ignition):
```bash
# Install Gazebo Sim (Garden version)
sudo apt install gz-garden
```

---

### Preparing URDF for Gazebo

Your URDF from Module 1 needs Gazebo-specific additions:

#### 1. Add Gazebo Colors

Gazebo uses a different color format than RViz:

```xml
<link name="torso_link">
  <visual>
    <!-- ... visual geometry ... -->
  </visual>
  
  <!-- Gazebo references the visual material -->
  <gazebo reference="torso_link">
    <material>Gazebo/Gray</material>
  </gazebo>
</link>
```

#### 2. Add Transmission Elements

Transmissions connect joints to actuators:

```xml
<transmission name="left_knee_trans">
  <type>transmission_interface/SimpleTransmission</type>
  <joint name="left_knee_joint">
    <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
  </joint>
  <actuator name="left_knee_motor">
    <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
    <mechanicalReduction>1</mechanicalReduction>
  </actuator>
</transmission>
```

#### 3. Add Gazebo Plugins

Plugins enable ROS 2 communication:

```xml
<gazebo>
  <!-- ROS 2 control plugin -->
  <plugin name="gz_ros2_control" filename="libgz_ros2_control-system.so">
    <parameters>$(find hello_robot)/config/ros2_control.yaml</parameters>
  </plugin>
  
  <!-- IMU sensor plugin -->
  <plugin name="imu_plugin" filename="libgazebo_ros_imu_sensor.so">
    <ros>
      <namespace>/imu</namespace>
      <remapping>~/out:=data</remapping>
    </ros>
    <initial_orientation_as_reference>false</initial_orientation_as_reference>
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    <visualize>true</visualize>
    <imu>
      <frame>
        <name>imu_link</name>
      </frame>
      <orientation>
        <x>0</x>
        <y>0</y>
        <z>0</z>
      </orientation>
    </imu>
  </plugin>
</gazebo>
```

---

### Complete Gazebo-Ready URDF

Here's your humanoid URDF enhanced for Gazebo:

```xml
<?xml version="1.0"?>
<robot name="simple_humanoid_gazebo">
  
  <!-- Include your existing links and joints from Module 1 -->
  <!-- ... torso, head, arms, legs ... -->
  
  <!-- Add Gazebo materials -->
  <gazebo reference="torso_link">
    <material>Gazebo/Gray</material>
  </gazebo>
  
  <gazebo reference="head_link">
    <material>Gazebo/White</material>
  </gazebo>
  
  <gazebo reference="left_upper_arm_link">
    <material>Gazebo/Gray</material>
  </gazebo>
  
  <!-- Add transmissions for each joint -->
  <transmission name="left_shoulder_trans">
    <type>transmission_interface/SimpleTransmission</type>
    <joint name="left_shoulder_joint">
      <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
    </joint>
    <actuator name="left_shoulder_motor">
      <hardwareInterface>hardware_interface/EffortJointInterface</hardwareInterface>
      <mechanicalReduction>1</mechanicalReduction>
    </actuator>
  </transmission>
  
  <!-- Add ROS 2 control plugin -->
  <gazebo>
    <plugin name="gz_ros2_control" filename="libgz_ros2_control-system.so">
      <parameters>$(find hello_robot)/config/ros2_control.yaml</parameters>
    </plugin>
  </gazebo>
  
</robot>
```

---

### Creating the ROS 2 Control Configuration

Create `config/ros2_control.yaml`:

```yaml
controller_manager:
  ros__parameters:
    update_rate: 100  # Hz
    
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster
    
    joint_trajectory_controller:
      type: joint_trajectory_controller/JointTrajectoryController

joint_trajectory_controller:
  ros__parameters:
    joints:
      - left_shoulder_joint
      - left_elbow_joint
      - right_shoulder_joint
      - left_hip_joint
      - left_knee_joint
      - left_ankle_joint
      - right_hip_joint
      - right_knee_joint
      - right_ankle_joint
    
    command_interfaces:
      - effort
    
    state_interfaces:
      - position
      - velocity
    
    gains:
      left_shoulder_joint: {p: 100.0, i: 0.01, d: 10.0}
      left_elbow_joint: {p: 50.0, i: 0.01, d: 5.0}
      right_shoulder_joint: {p: 100.0, i: 0.01, d: 10.0}
      left_hip_joint: {p: 200.0, i: 0.1, d: 20.0}
      left_knee_joint: {p: 200.0, i: 0.1, d: 20.0}
      left_ankle_joint: {p: 50.0, i: 0.01, d: 5.0}
      right_hip_joint: {p: 200.0, i: 0.1, d: 20.0}
      right_knee_joint: {p: 200.0, i: 0.1, d: 20.0}
      right_ankle_joint: {p: 50.0, i: 0.01, d: 5.0}
```

---

### Creating a Gazebo World

Create a simulation world with ground plane and lighting:

Create `worlds/humanoid_world.world`:

```xml
<?xml version="1.0"?>
<sdf version="1.6">
  <world name="humanoid_world">
    
    <!-- Global light -->
    <light name="sun" type="directional">
      <pose>0 0 10 0 -1.57 0</pose>
      <diffuse>1 1 1 1</diffuse>
      <specular>0.5 0.5 0.5 1</specular>
    </light>
    
    <!-- Ground plane -->
    <include>
      <uri>model://ground_plane</uri>
    </include>
    
    <!-- Your humanoid will be spawned here by ROS 2 -->
    
  </world>
</sdf>
```

---

### Launch File for Gazebo

Create `launch/gazebo_launch.py`:

```python
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import IncludeSubstitution, ExecuteProcess
from launch.substitutions import PathJoinSubstitution
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    pkg_share = get_package_share_directory('hello_robot')
    
    # Gazebo launch
    gazebo = IncludeSubstitution([
        PathJoinSubstitution([
            get_package_share_directory('gazebo_ros'),
            'launch', 'gazebo.launch.py'
        ])
    ])
    
    # Robot state publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        arguments=[os.path.join(pkg_share, 'urdf', 'simple_humanoid_gazebo.urdf')]
    )
    
    # Spawn robot in Gazebo
    spawn_robot = Node(
        package='gazebo_ros',
        executable='spawn_entity.py',
        name='spawn_robot',
        output='screen',
        arguments=[
            '-topic', 'robot_description',
            '-entity', 'simple_humanoid',
            '-x', '0', '-y', '0', '-z', '0.5'  # Spawn above ground
        ]
    )
    
    # Joint state broadcaster
    joint_state_broadcaster = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['joint_state_broadcaster']
    )
    
    # Joint trajectory controller
    joint_trajectory_controller = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['joint_trajectory_controller']
    )
    
    return LaunchDescription([
        gazebo,
        robot_state_publisher,
        spawn_robot,
        joint_state_broadcaster,
        joint_trajectory_controller,
    ])
```

---

### Running the Simulation

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash

# Launch Gazebo with your robot
ros2 launch hello_robot gazebo_launch.py
```

Gazebo will open with your humanoid standing on the ground plane!

---

### Controlling the Robot in Simulation

Create a simple controller node:

```python
# src/hello_robot/hello_robot/walk_controller.py
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint

class WalkController(Node):
    def __init__(self):
        super().__init__('walk_controller')
        self.publisher = self.create_publisher(
            JointTrajectory,
            '/joint_trajectory_controller/joint_trajectory',
            10
        )
        self.timer = self.create_timer(2.0, self.send_trajectory)
    
    def send_trajectory(self):
        # Simple knee bend motion
        trajectory = JointTrajectory()
        trajectory.joint_names = [
            'left_knee_joint',
            'right_knee_joint'
        ]
        
        point = JointTrajectoryPoint()
        point.positions = [0.5, 0.5]  # Bend knees to 0.5 radians
        point.time_from_start = rclpy.duration.Duration(seconds=1).to_msg()
        
        trajectory.points.append(point)
        self.publisher.publish(trajectory)
        self.get_logger().info('Sent knee bend trajectory')

def main(args=None):
    rclpy.init(args=args)
    node = WalkController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

Run the controller:
```bash
ros2 run hello_robot walk_controller
```

Watch your robot bend its knees in simulation!

---

### Adding Physics Properties

For realistic simulation, add friction and damping:

```xml
<link name="foot_link">
  <collision>
    <geometry>
      <box size="0.2 0.1 0.05"/>
    </geometry>
    <!-- Surface properties for realistic contact -->
    <surface>
      <friction>
        <ode>
          <mu>1.0</mu>    <!-- Friction coefficient -->
          <mu2>1.0</mu2>
        </ode>
      </friction>
      <bounce>
        <restitution_coefficient>0.0</restitution_coefficient>
        <threshold>1000.0</threshold>
      </bounce>
    </surface>
  </collision>
</link>

<joints name="knee_joint">
  <!-- Joint damping for realistic movement -->
  <dynamics damping="0.5" friction="0.1"/>
</joint>
```

---

### Debugging Tips

**Robot falls over immediately:**
- Check center of mass in inertial tags
- Verify joint limits are reasonable
- Increase PID gains in ros2_control.yaml

**Robot spawns in wrong position:**
- Adjust spawn coordinates in launch file
- Check URDF link origins

**Joints jitter or vibrate:**
- Reduce PID gains
- Increase solver iterations in world file
- Check for conflicting transmissions

---

### Summary

You've learned:
- ✅ How to prepare URDF for Gazebo simulation
- ✅ How to configure ROS 2 control
- ✅ How to launch Gazebo with your robot
- ✅ How to send joint commands in simulation
- ✅ Physics properties for realistic behavior

---

### Exercises

1. **Add a camera** to your humanoid's head and view the image topic
2. **Create an obstacle course** in Gazebo with boxes and ramps
3. **Implement a walking gait** by sending joint trajectories
4. **Add contact sensors** to the feet and detect ground contact

---

### What's Next?

In the next chapter, you'll learn **Unity for Human-Robot Interaction**—creating rich, interactive 3D environments for testing how humans and robots collaborate.

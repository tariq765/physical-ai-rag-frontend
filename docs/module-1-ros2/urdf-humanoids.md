# URDF for Humanoids

## Describing Robot Geometry and Kinematics

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Understand URDF (Unified Robot Description Format) structure
- Create links and joints for a humanoid robot
- Add visual and collision geometry
- Visualize your robot in RViz

---

### What is URDF?

**URDF** (Unified Robot Description Format) is an XML format used to describe a robot's physical properties:

- **Links** — Rigid bodies with geometry, mass, and visual properties
- **Joints** — Connections between links with motion constraints
- **Sensors** — Camera, LiDAR, IMU attachments
- **Transmission** — Motor and actuator specifications

**Why URDF matters for humanoids:**
Humanoid robots have 20-50+ degrees of freedom. URDF provides a standardized way to describe this complex kinematic chain.

---

### URDF Structure Overview

A URDF file describes a robot as a **tree of links and joints**:

```xml
<?xml version="1.0"?>
<robot name="humanoid">
  
  <!-- Links define rigid bodies -->
  <link name="base_link">
    <visual>...</visual>
    <collision>...</collision>
    <inertial>...</inertial>
  </link>
  
  <!-- Joints connect links -->
  <joint name="hip_joint" type="revolute">
    <parent link="base_link"/>
    <child link="left_leg"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57" effort="100" velocity="1.0"/>
  </joint>
  
</robot>
```

---

### Links: The Building Blocks

A **link** represents a rigid body. Each link can have:

1. **Visual** — How the link looks in visualization
2. **Collision** — Simplified geometry for collision detection
3. **Inertial** — Mass and center of mass for physics simulation

#### Basic Link Example

```xml
<link name="torso_link">
  <!-- Visual properties (what you see in RViz) -->
  <visual>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <box size="0.3 0.2 0.5"/>
    </geometry>
    <material name="blue">
      <color rgba="0 0 0.8 1"/>
    </material>
  </visual>
  
  <!-- Collision properties (used for physics) -->
  <collision>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <box size="0.3 0.2 0.5"/>
    </geometry>
  </collision>
  
  <!-- Inertial properties (for dynamics) -->
  <inertial>
    <mass value="10.0"/>
    <inertia ixx="0.5" ixy="0.0" ixz="0.0" 
             iyy="0.5" iyz="0.0" izz="0.5"/>
  </inertial>
</link>
```

#### Geometry Types

URDF supports several geometry types:

```xml
<!-- Box: x, y, z dimensions -->
<box size="0.1 0.2 0.3"/>

<!-- Cylinder: radius and height -->
<cylinder radius="0.05" length="0.3"/>

<!-- Sphere: radius -->
<sphere radius="0.1"/>

<!-- Mesh: external 3D model -->
<mesh filename="package://my_robot/meshes/arm.stl" scale="1 1 1"/>
```

**Tip**: Use simple geometry (boxes, cylinders) for collision and detailed meshes for visual representation.

---

### Joints: Connecting Links

A **joint** defines how two links connect and move relative to each other.

#### Joint Types

| Type | Description | Example in Humanoid |
|------|-------------|---------------------|
| `revolute` | Rotates with limits | Knee, elbow |
| `continuous` | Rotates without limits | Wheel |
| `prismatic` | Slides with limits | Linear actuator |
| `fixed` | No movement | Rigid connection |
| `floating` | 6 DOF movement | Not commonly used |

#### Complete Joint Example

```xml
<joint name="left_knee_joint" type="revolute">
  <!-- Parent and child links -->
  <parent link="left_thigh_link"/>
  <child link="left_shin_link"/>
  
  <!-- Joint origin (where joint is located) -->
  <origin xyz="0 0 -0.4" rpy="0 0 0"/>
  
  <!-- Axis of rotation (z-axis in this case) -->
  <axis xyz="0 1 0"/>
  
  <!-- Joint limits -->
  <limit lower="0.0" upper="2.5" effort="50" velocity="2.0"/>
  
  <!-- Optional: damping and friction -->
  <dynamics damping="0.1" friction="0.1"/>
</joint>
```

---

### Building a Simple Humanoid

Let's create a minimal humanoid robot with:
- Base (torso)
- Head
- Two arms (simplified)
- Two legs (simplified)

```xml
<?xml version="1.0"?>
<robot name="simple_humanoid">
  
  <!-- BASE/TORSO -->
  <link name="torso_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry>
        <box size="0.2 0.15 0.4"/>
      </geometry>
      <material name="gray">
        <color rgba="0.5 0.5 0.5 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.2 0.15 0.4"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="5.0"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" 
               iyy="0.1" iyz="0.0" izz="0.1"/>
    </inertial>
  </link>
  
  <!-- HEAD -->
  <link name="head_link">
    <visual>
      <origin xyz="0 0 0" rpy="0 0 0"/>
      <geometry>
        <sphere radius="0.1"/>
      </geometry>
      <material name="white">
        <color rgba="1 1 1 1"/>
      </material>
    </visual>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.01" ixy="0.0" ixz="0.0" 
               iyy="0.01" iyz="0.0" izz="0.01"/>
    </inertial>
  </link>
  
  <joint name="head_joint" type="revolute">
    <parent link="torso_link"/>
    <child link="head_link"/>
    <origin xyz="0 0 0.25" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57" effort="10" velocity="1.0"/>
  </joint>
  
  <!-- LEFT ARM -->
  <link name="left_upper_arm_link">
    <visual>
      <origin xyz="0 0 -0.15" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.04" length="0.3"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="1.5"/>
      <inertia ixx="0.01" ixy="0.0" ixz="0.0" 
               iyy="0.01" iyz="0.0" izz="0.01"/>
    </inertial>
  </link>
  
  <joint name="left_shoulder_joint" type="revolute">
    <parent link="torso_link"/>
    <child link="left_upper_arm_link"/>
    <origin xyz="0 0.12 0.15" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-1.57" upper="1.57" effort="20" velocity="1.5"/>
  </joint>
  
  <!-- LEFT FOREARM -->
  <link name="left_forearm_link">
    <visual>
      <origin xyz="0 0 -0.125" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.035" length="0.25"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.005" ixy="0.0" ixz="0.0" 
               iyy="0.005" iyz="0.0" izz="0.005"/>
    </inertial>
  </link>
  
  <joint name="left_elbow_joint" type="revolute">
    <parent link="left_upper_arm_link"/>
    <child link="left_forearm_link"/>
    <origin xyz="0 0 -0.3" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-2.0" upper="0.0" effort="15" velocity="2.0"/>
  </joint>
  
  <!-- RIGHT ARM (mirrored) -->
  <link name="right_upper_arm_link">
    <visual>
      <origin xyz="0 0 -0.15" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.04" length="0.3"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="1.5"/>
      <inertia ixx="0.01" ixy="0.0" ixz="0.0" 
               iyy="0.01" iyz="0.0" izz="0.01"/>
    </inertial>
  </link>
  
  <joint name="right_shoulder_joint" type="revolute">
    <parent link="torso_link"/>
    <child link="right_upper_arm_link"/>
    <origin xyz="0 -0.12 0.15" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-1.57" upper="1.57" effort="20" velocity="1.5"/>
  </joint>
  
  <!-- LEFT LEG -->
  <link name="left_thigh_link">
    <visual>
      <origin xyz="0 0 -0.2" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.06" length="0.4"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="3.0"/>
      <inertia ixx="0.05" ixy="0.0" ixz="0.0" 
               iyy="0.05" iyz="0.0" izz="0.05"/>
    </inertial>
  </link>
  
  <joint name="left_hip_joint" type="revolute">
    <parent link="torso_link"/>
    <child link="left_thigh_link"/>
    <origin xyz="0 0.08 -0.25" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-1.57" upper="1.57" effort="50" velocity="2.0"/>
  </joint>
  
  <!-- LEFT SHIN -->
  <link name="left_shin_link">
    <visual>
      <origin xyz="0 0 -0.2" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.05" length="0.4"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="2.0"/>
      <inertia ixx="0.03" ixy="0.0" ixz="0.0" 
               iyy="0.03" iyz="0.0" izz="0.03"/>
    </inertial>
  </link>
  
  <joint name="left_knee_joint" type="revolute">
    <parent link="left_thigh_link"/>
    <child link="left_shin_link"/>
    <origin xyz="0 0 -0.4" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="0.0" upper="2.5" effort="50" velocity="2.0"/>
  </joint>
  
  <!-- LEFT FOOT -->
  <link name="left_foot_link">
    <visual>
      <origin xyz="0.05 0 -0.05" rpy="0 0 0"/>
      <geometry>
        <box size="0.2 0.1 0.05"/>
      </geometry>
      <material name="black">
        <color rgba="0.1 0.1 0.1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.2 0.1 0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" 
               iyy="0.001" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>
  
  <joint name="left_ankle_joint" type="revolute">
    <parent link="left_shin_link"/>
    <child link="left_foot_link"/>
    <origin xyz="0 0 -0.4" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-0.5" upper="0.5" effort="30" velocity="2.0"/>
  </joint>
  
  <!-- RIGHT LEG (mirrored) -->
  <link name="right_thigh_link">
    <visual>
      <origin xyz="0 0 -0.2" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.06" length="0.4"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="3.0"/>
      <inertia ixx="0.05" ixy="0.0" ixz="0.0" 
               iyy="0.05" iyz="0.0" izz="0.05"/>
    </inertial>
  </link>
  
  <joint name="right_hip_joint" type="revolute">
    <parent link="torso_link"/>
    <child link="right_thigh_link"/>
    <origin xyz="0 -0.08 -0.25" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-1.57" upper="1.57" effort="50" velocity="2.0"/>
  </joint>
  
  <link name="right_shin_link">
    <visual>
      <origin xyz="0 0 -0.2" rpy="0 0 0"/>
      <geometry>
        <cylinder radius="0.05" length="0.4"/>
      </geometry>
      <material name="gray"/>
    </visual>
    <inertial>
      <mass value="2.0"/>
      <inertia ixx="0.03" ixy="0.0" ixz="0.0" 
               iyy="0.03" iyz="0.0" izz="0.03"/>
    </inertial>
  </link>
  
  <joint name="right_knee_joint" type="revolute">
    <parent link="right_thigh_link"/>
    <child link="right_shin_link"/>
    <origin xyz="0 0 -0.4" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="0.0" upper="2.5" effort="50" velocity="2.0"/>
  </joint>
  
  <link name="right_foot_link">
    <visual>
      <origin xyz="0.05 0 -0.05" rpy="0 0 0"/>
      <geometry>
        <box size="0.2 0.1 0.05"/>
      </geometry>
      <material name="black"/>
    </visual>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" 
               iyy="0.001" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>
  
  <joint name="right_ankle_joint" type="revolute">
    <parent link="right_shin_link"/>
    <child link="right_foot_link"/>
    <origin xyz="0 0 -0.4" rpy="0 0 0"/>
    <axis xyz="1 0 0"/>
    <limit lower="-0.5" upper="0.5" effort="30" velocity="2.0"/>
  </joint>
  
</robot>
```

Save this as `src/hello_robot/urdf/simple_humanoid.urdf`.

---

### Visualizing in RViz

**RViz** (ROS Visualizer) is the 3D visualization tool for ROS 2.

#### Step 1: Create a Launch File

Create `src/hello_robot/launch/display_robot.launch.py`:

```python
from launch import LaunchDescription
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    urdf_path = os.path.join(
        get_package_share_directory('hello_robot'),
        'urdf', 'simple_humanoid.urdf'
    )
    
    return LaunchDescription([
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            name='robot_state_publisher',
            output='screen',
            arguments=[urdf_path]
        ),
        Node(
            package='joint_state_publisher_gui',
            executable='joint_state_publisher_gui',
            name='joint_state_publisher_gui',
            output='screen'
        ),
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            output='screen',
            arguments=['-d', os.path.join(
                get_package_share_directory('hello_robot'),
                'rviz', 'robot_display.rviz'
            )]
        )
    ])
```

#### Step 2: Create RViz Configuration

Create `src/hello_robot/rviz/robot_display.rviz` (you can also save from RViz GUI):

```yaml
Panels:
  - Class: rviz_common/Displays
Visualization Manager:
  Displays:
    - Class: rviz_default_plugins/RobotModel
      Name: RobotModel
      Description Topic:
        Value: /robot_description
      Enabled: true
      Alpha: 1.0
    - Class: rviz_default_plugins/TF
      Name: TF
      Enabled: true
  Global Options:
    Fixed Frame: torso_link
```

#### Step 3: Update package.xml

Add required dependencies:

```xml
<exec_depend>robot_state_publisher</exec_depend>
<exec_depend>joint_state_publisher_gui</exec_depend>
<exec_depend>rviz2</exec_depend>
<exec_depend>launch</exec_depend>
<exec_depend>launch_ros</exec_depend>
```

#### Step 4: Run the Display

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash

# Launch RViz with robot model
ros2 launch hello_robot display_robot.launch.py
```

In RViz:
1. Click "Add" → "RobotModel"
2. Set Description Topic to `/robot_description`
3. Use the Joint State Publisher GUI to move joints!

---

### URDF Best Practices for Humanoids

1. **Use XACRO for complex robots**
   - URDF becomes verbose for 20+ DOF robots
   - XACRO (XML Macros) enables reusable components
   
2. **Separate visual and collision geometry**
   - Simple collision meshes improve performance
   - Detailed visual meshes for appearance

3. **Name conventions**
   - Use descriptive names: `left_knee_joint`, not `joint_5`
   - Consistent prefixes: `left_`, `right_`, `base_`

4. **Organize with packages**
   ```
   my_humanoid_description/
   ├── urdf/
   │   ├── humanoid.urdf
   │   └── humanoid.xacro
   ├── meshes/
   │   ├── arm.stl
   │   └── leg.stl
   └── rviz/
       └── display.rviz
   ```

---

### Summary

You've learned:
- ✅ URDF structure and purpose
- ✅ How to create links with visual, collision, and inertial properties
- ✅ How to define joints with limits and constraints
- ✅ How to build a complete (simplified) humanoid robot
- ✅ How to visualize in RViz

---

### Exercises

1. **Add a hand** to each arm with finger links
2. **Add a camera** to the head using the `<sensor>` tag
3. **Import custom meshes** (download a simple STL and replace a cylinder)
4. **Create a XACRO macro** to generate symmetric left/right limbs

---

### Module 1 Project

Now that you understand URDF, combine everything you've learned:

**Project: Interactive Humanoid Display**
1. Create a ROS 2 package with your humanoid URDF
2. Add a publisher node that publishes joint angles
3. Visualize the robot in RViz
4. Use sliders to control joint movements in real-time

---

### What's Next?

You've completed Module 1! You now understand:
- ROS 2 architecture and communication
- How to describe humanoid robots with URDF
- How to visualize robots in RViz

In **Module 2: Digital Twin**, you'll learn to simulate your robot in realistic physics environments with Gazebo and Unity.

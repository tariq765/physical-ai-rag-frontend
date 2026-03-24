# Nav2 for Humanoids

## Autonomous Navigation for Bipedal Robots

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Understand Nav2 architecture and components
- Configure Nav2 for humanoid locomotion
- Implement walking gait integration
- Handle dynamic obstacle avoidance
- Build complete navigation pipelines

---

### Nav2 Overview

**Nav2** is the ROS 2 navigation stack, originally designed for differential drive robots. For humanoids, we adapt it for:

```
┌─────────────────────────────────────────────────────────┐
│                    Nav2 Stack                            │
├─────────────────────────────────────────────────────────┤
│  Behavior Trees   │ High-level navigation logic        │
│  Planner Server   │ Global path planning               │
│  Controller Server│ Local trajectory control           │
│  Recovery Server  │ Stuck recovery behaviors           │
│  Costmap 2D       │ Obstacle representation            │
└─────────────────────────────────────────────────────────┘
```

**Humanoid-specific adaptations:**
- Walking gaits instead of velocity commands
- Step planning for uneven terrain
- Balance constraints during navigation
- Foot placement optimization

---

### Nav2 Architecture for Humanoids

```
┌──────────────────────────────────────────────────────────┐
│                   Navigation Stack                        │
├──────────────────────────────────────────────────────────┤
│  Goal Pose  │  Nav2  │  Footstep Plan  │  Walk Controller│
│  (x,y,θ)    │  Server│  Generator      │                │
└──────────────────────────────────────────────────────────┘
         │                │                    │
         ▼                ▼                    ▼
┌─────────────────┐ ┌─────────────┐  ┌─────────────────┐
│  Global Planner │ │  Footstep   │  │  Joint Traj.    │
│  (A*, RRT*)     │ │  Optimizer  │  │  Controller     │
└─────────────────┘ └─────────────┘  └─────────────────┘
```

---

### Installing Nav2

```bash
# Install Nav2 packages for ROS 2 Humble
sudo apt install ros-humble-nav2*
sudo apt install ros-humble-slam-toolbox

# Verify installation
ros2 pkg list | grep nav2
```

---

### Basic Nav2 Configuration

Create `nav2_params.yaml`:

```yaml
nav2_controller:
  ros__parameters:
    controller_frequency: 20.0
    min_x_velocity_threshold: 0.001
    min_y_velocity_threshold: 0.001
    min_theta_velocity_threshold: 0.001
    
    # For humanoids, we use a custom footstep controller
    controller_plugins: ["footstep_controller"]
    
    footstep_controller:
      plugin: "humanoid_nav::FootstepController"
      step_length: 0.3
      step_width: 0.15
      max_step_frequency: 2.0

nav2_planner:
  ros__parameters:
    planner_plugins: ["grid_based"]
    
    grid_based:
      plugin: "nav2_navfn_planner/NavfnPlanner"
      tolerance: 0.5
      use_astar: true
      allow_unknown: true
      
      # Humanoid-specific: consider step constraints
      step_size: 0.05
      min_turning_radius: 0.5

costmap:
  global_costmap:
    ros__parameters:
      global_frame: map
      robot_base_frame: base_link
      update_frequency: 1.0
      publish_frequency: 1.0
      width: 50
      height: 50
      resolution: 0.05
      
      # Layers for humanoid navigation
      plugins: ["static", "obstacles", "inflation"]
      
      static:
        plugin: "nav2_costmap_2d::StaticLayer"
        map_subscribe_topic: map
      
      obstacles:
        plugin: "nav2_costmap_2d::ObstacleLayer"
        enabled: true
        observation_sources: scan
        scan:
          topic: /scan
          max_obstacle_height: 2.0
          clearing: true
          marking: true
      
      inflation:
        plugin: "nav2_costmap_2d::InflationLayer"
        cost_scaling_factor: 3.0
        inflation_radius: 0.55
  
  local_costmap:
    ros__parameters:
      global_frame: odom
      robot_base_frame: base_link
      update_frequency: 5.0
      publish_frequency: 2.0
      width: 5
      height: 5
      resolution: 0.025
      
      plugins: ["obstacles", "inflation"]

nav2_recoveries:
  ros__parameters:
    recovery_plugins: ["spin", "backup", "wait"]
    
    spin:
      plugin: "nav2_recoveries/Spin"
      spin_dist: 1.57
    
    backup:
      plugin: "nav2_recoveries/Backup"
      backup_dist: 0.5
    
    wait:
      plugin: "nav2_recoveries/Wait"
      wait_duration: 5.0
```

---

### Footstep Planning

Humanoids navigate by stepping, not continuous motion:

```python
# footstep_planner.py
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseStamped
from nav_msgs.msg import Path
import numpy as np

class FootstepPlanner(Node):
    def __init__(self):
        super().__init__('footstep_planner')
        
        self.subscription = self.create_subscription(
            PoseStamped, '/goal_pose', self.goal_callback, 10
        )
        
        self.path_pub = self.create_publisher(
            Path, '/footstep_plan', 10
        )
        
        # Humanoid step parameters
        self.step_length = 0.3  # meters
        self.step_width = 0.15  # meters
        self.max_step_angle = 0.3  # radians
    
    def goal_callback(self, goal: PoseStamped):
        """Generate footstep plan to goal"""
        
        # Get current robot position
        current_pose = self.get_robot_pose()
        
        # Generate footsteps
        footsteps = self.generate_footsteps(
            current_pose, goal.pose
        )
        
        # Publish footstep path
        path_msg = Path()
        path_msg.header = goal.header
        path_msg.poses = footsteps
        self.path_pub.publish(path_msg)
        
        self.get_logger().info(
            f'Generated {len(footsteps)} footsteps'
        )
    
    def generate_footsteps(self, start, goal):
        """Generate sequence of foot placements"""
        
        footsteps = []
        
        # Calculate direction to goal
        dx = goal.position.x - start.position.x
        dy = goal.position.y - start.position.y
        distance = np.sqrt(dx**2 + dy**2)
        
        # Number of steps needed
        num_steps = int(distance / self.step_length)
        
        # Generate alternating left/right footsteps
        for i in range(num_steps):
            step = PoseStamped()
            step.header.frame_id = 'odom'
            
            # Interpolate position
            t = (i + 1) / num_steps
            step.pose.position.x = start.position.x + dx * t
            step.pose.position.y = start.position.y + dy * t
            step.pose.position.z = 0.0
            
            # Alternate foot placement (left/right)
            offset = self.step_width if i % 2 == 0 else -self.step_width
            step.pose.position.y += offset
            
            # Orient foot toward goal
            step.pose.orientation.z = np.arctan2(dy, dx) / 2
            
            footsteps.append(step)
        
        return footsteps
    
    def get_robot_pose(self):
        """Get current robot pose from TF"""
        # Implementation using tf2
        pass

def main(args=None):
    rclpy.init(args=args)
    node = FootstepPlanner()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Walking Gait Integration

Connect Nav2 to your walking controller:

```python
# walk_controller.py
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint

class WalkController(Node):
    def __init__(self):
        super().__init__('walk_controller')
        
        self.subscription = self.create_subscription(
            Twist, '/cmd_vel', self.velocity_callback, 10
        )
        
        self.trajectory_pub = self.create_publisher(
            JointTrajectory, '/joint_trajectory_controller/joint_trajectory', 10
        )
        
        # Walking parameters
        self.step_frequency = 1.0  # Hz
        self.step_height = 0.1  # meters
        self.current_phase = 0.0
        
        # Joint names for walking
        self.joint_names = [
            'left_hip_joint', 'left_knee_joint', 'left_ankle_joint',
            'right_hip_joint', 'right_knee_joint', 'right_ankle_joint'
        ]
    
    def velocity_callback(self, msg: Twist):
        """Convert velocity commands to walking gait"""
        
        linear_vel = msg.linear.x
        angular_vel = msg.angular.z
        
        # Generate walking trajectory
        trajectory = self.generate_walking_trajectory(
            linear_vel, angular_vel
        )
        
        self.trajectory_pub.publish(trajectory)
    
    def generate_walking_trajectory(self, linear_vel, angular_vel):
        """Generate joint trajectory for walking"""
        
        trajectory = JointTrajectory()
        trajectory.joint_names = self.joint_names
        
        # Generate trajectory points for one step cycle
        num_points = 20
        for i in range(num_points):
            t = i / num_points
            
            point = JointTrajectoryPoint()
            
            # Calculate joint angles for this timestep
            positions = self.calculate_walking_gait(
                t, linear_vel, angular_vel
            )
            
            point.positions = positions
            point.time_from_start = rclpy.duration.Duration(
                seconds=t / self.step_frequency
            ).to_msg()
            
            trajectory.points.append(point)
        
        return trajectory
    
    def calculate_walking_gait(self, t, linear_vel, angular_vel):
        """Calculate joint angles for walking gait"""
        
        # Simplified walking pattern (replace with actual gait generator)
        import numpy as np
        
        # Hip: swing forward/back
        left_hip = np.sin(2 * np.pi * t) * 0.3 * linear_vel
        right_hip = -np.sin(2 * np.pi * t) * 0.3 * linear_vel
        
        # Knee: bend during swing phase
        left_knee = np.maximum(0, np.sin(2 * np.pi * t)) * 0.5
        right_knee = np.maximum(0, -np.sin(2 * np.pi * t)) * 0.5
        
        # Ankle: maintain foot level
        left_ankle = -left_knee * 0.5
        right_ankle = -right_knee * 0.5
        
        # Add turning
        if angular_vel > 0:
            left_hip += 0.1
            right_hip -= 0.1
        
        return [
            left_hip, left_knee, left_ankle,
            right_hip, right_knee, right_ankle
        ]

def main(args=None):
    rclpy.init(args=args)
    node = WalkController()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Dynamic Obstacle Avoidance

Handle moving obstacles with DWA (Dynamic Window Approach):

```python
# dynamic_obstacle_avoidance.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import Twist
import numpy as np

class DynamicAvoidance(Node):
    def __init__(self):
        super().__init__('dynamic_avoidance')
        
        self.scan_sub = self.create_subscription(
            LaserScan, '/scan', self.scan_callback, 10
        )
        
        self.cmd_pub = self.create_publisher(
            Twist, '/cmd_vel_avoidance', 10
        )
        
        self.safety_distance = 0.5  # meters
        self.max_velocity = 0.5  # m/s
    
    def scan_callback(self, msg: LaserScan):
        """Process LiDAR data for obstacle avoidance"""
        
        ranges = np.array(msg.ranges)
        
        # Filter invalid readings
        valid = np.isfinite(ranges)
        ranges = ranges[valid]
        
        # Find closest obstacle
        min_distance = np.min(ranges)
        min_index = np.argmin(ranges)
        
        # Calculate obstacle angle
        angle = msg.angle_min + min_index * msg.angle_increment
        
        # Generate avoidance command
        twist = Twist()
        
        if min_distance < self.safety_distance:
            # Obstacle too close - stop and turn
            twist.linear.x = 0.0
            twist.angular.z = np.sign(angle) * 0.5
            self.get_logger().warn(
                f'Obstacle at {min_distance:.2f}m, avoiding!'
            )
        else:
            # Clear path - continue
            twist.linear.x = self.max_velocity
            twist.angular.z = 0.0
        
        self.cmd_pub.publish(twist)

def main(args=None):
    rclpy.init(args=args)
    node = DynamicAvoidance()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Complete Navigation Launch

```python
# humanoid_navigation_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import IncludeSubstitution
from launch.substitutions import PathJoinSubstitution
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    nav2_dir = get_package_share_directory('nav2_bringup')
    
    return LaunchDescription([
        # SLAM for mapping
        Node(
            package='slam_toolbox',
            executable='async_slam_toolbox_node',
            name='slam_toolbox',
            parameters=[{
                'odom_frame': 'odom',
                'map_frame': 'map',
                'base_frame': 'base_link',
                'scan_topic': '/scan'
            }]
        ),
        
        # Nav2 lifecycle manager
        Node(
            package='nav2_lifecycle_manager',
            executable='lifecycle_manager',
            name='lifecycle_manager_navigation',
            parameters=[{
                'autostart': True,
                'node_names': [
                    'controller_server',
                    'planner_server',
                    'recoveries_server',
                    'waypoint_follower'
                ]
            }]
        ),
        
        # Nav2 controller
        Node(
            package='nav2_controller',
            executable='controller_server',
            name='controller_server',
            parameters=['nav2_params.yaml']
        ),
        
        # Nav2 planner
        Node(
            package='nav2_planner',
            executable='planner_server',
            name='planner_server',
            parameters=['nav2_params.yaml']
        ),
        
        # Costmap servers
        Node(
            package='nav2_costmap_2d',
            executable='costmap_server',
            name='global_costmap',
            parameters=['nav2_params.yaml']
        ),
        
        # Footstep planner (custom)
        Node(
            package='humanoid_nav',
            executable='footstep_planner',
            name='footstep_planner'
        ),
        
        # Walk controller
        Node(
            package='humanoid_nav',
            executable='walk_controller',
            name='walk_controller'
        )
    ])
```

---

### Testing Navigation

```bash
# Launch navigation stack
ros2 launch humanoid_navigation_launch.py

# Send goal via command line
ros2 action send_goal /navigate_to_pose \
  nav2_msgs/action/NavigateToPose \
  "{pose: {header: {frame_id: map}, pose: {position: {x: 2.0, y: 3.0}, orientation: {z: 0.707, w: 0.707}}}}"

# Monitor in RViz
rviz2 -d $(ros2 pkg prefix nav2_bringup)/share/nav2_bringup/rviz/nav2_default_view.rviz
```

---

### Summary

You've learned:
- ✅ Nav2 architecture and components
- ✅ Footstep planning for humanoids
- ✅ Walking gait integration
- ✅ Dynamic obstacle avoidance
- ✅ Complete navigation pipeline

---

### Exercises

1. **Configure Nav2** for your humanoid robot
2. **Implement footstep planner** with alternating steps
3. **Create walking gait** that responds to velocity commands
4. **Test obstacle avoidance** with moving obstacles

---

### Module 3 Project

**Complete Isaac Navigation System:**
1. Simulate humanoid in Isaac Sim
2. Add Isaac ROS perception pipeline
3. Configure Nav2 for footstep navigation
4. Demonstrate autonomous navigation with obstacle avoidance

---

### What's Next?

In **Module 4: Vision-Language-Action**, you'll connect natural language to robot actions, enabling humans to command robots conversationally.

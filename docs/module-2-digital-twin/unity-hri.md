# Unity for Human-Robot Interaction

## Creating Interactive 3D Environments

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Install and configure Unity for robotics simulation
- Import ROS 2 robots into Unity using ROS-TCP-Connector
- Create interactive HRI scenarios
- Visualize robot sensor data in Unity
- Build VR/AR interfaces for robot teleoperation

---

### Why Unity for HRI?

While Gazebo excels at physics simulation, **Unity** offers unique advantages for Human-Robot Interaction:

| Feature | Gazebo | Unity |
|---------|--------|-------|
| Physics accuracy | ★★★★★ | ★★★☆☆ |
| Visual fidelity | ★★★☆☆ | ★★★★★ |
| VR/AR support | Limited | Native |
| UI creation | Basic | Advanced |
| Asset store | Limited | Extensive |
| HRI scenarios | Good | Excellent |

**Use Unity when:**
- Testing human-robot collaboration scenarios
- Creating training simulations for robot operators
- Building VR teleoperation interfaces
- Developing AR overlays for robot status

---

### Installing Unity for Robotics

#### Step 1: Install Unity Hub

Download from [unity.com](https://unity.com):
```bash
# Download Unity Hub (Linux)
wget -O unityhub.deb https://public-cdn.cloud.unity3d.com/hub/prod/UnityHub.AppImage
```

#### Step 2: Install Unity Editor

Recommended version: **Unity 2022 LTS**
- Install via Unity Hub
- Select modules:
  - ✅ Android Build Support (optional)
  - ✅ Visual Studio Editor
  - ✅ Linux Build Support (if on Linux)

#### Step 3: Install ROS-TCP-Connector

Unity Robotics Hub provides ROS 2 integration:

```bash
# In Unity, open Package Manager
# Add package from git URL:
https://github.com/Unity-Technologies/ROS-TCP-Connector.git?path=/com.unity.robotics.ros-tcp-connector
```

---

### Setting Up Unity Project

#### Create New Project

1. Open Unity Hub → New Project
2. Select **3D (URP)** template (Universal Render Pipeline)
3. Name: `HRI_Simulation`
4. Create

#### Import ROS-TCP-Connector

1. Window → Package Manager
2. "+" → Add package from git URL
3. Enter: `https://github.com/Unity-Technologies/ROS-TCP-Connector.git`
4. Install

#### Project Structure

```
Assets/
├── Scenes/
│   └── HRIScene.unity
├── Scripts/
│   ├── RobotController.cs
│   └── JointSubscriber.cs
├── Prefabs/
│   └── HumanoidRobot.prefab
├── URDF/
│   └── simple_humanoid.urdf
└── Materials/
```

---

### Importing URDF into Unity

Unity can parse URDF files directly:

#### Step 1: Prepare URDF

Copy your humanoid URDF to `Assets/URDF/`:

```bash
cp ~/ros2_ws/src/hello_robot/urdf/simple_humanoid.urdf \
   /path/to/Unity/Project/Assets/URDF/
```

#### Step 2: Import in Unity

1. In Unity, select the URDF file in Project window
2. In Inspector, click **Import URDF**
3. Configure import settings:
   - Fixed Update Rate: 50 Hz
   - Use Collision: Yes
   - Visualize: Yes

#### Step 3: Add ROS-TCP-Connector

Add to your robot GameObject:
```csharp
// RobotController.cs
using UnityEngine;
using RosMessageTypes.Geometry;
using RosMessageTypes.Sensor;
using Unity.Robotics.ROSTCPConnector;
using Unity.Robotics.ROSTCPConnector.ROSGeometry;

public class RobotController : MonoBehaviour
{
    [SerializeField] string robotName = "simple_humanoid";
    
    private ROSConnection ros;
    
    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.RegisterRobotModel<RobotModel>(robotName);
        
        // Subscribe to joint states
        ros.Subscribe<JointStateMsg>("joint_states", OnJointStateReceived);
    }
    
    void OnJointStateReceived(JointStateMsg msg)
    {
        // Update joint angles from ROS 2
        for (int i = 0; i < msg.name.Length; i++)
        {
            string jointName = msg.name[i];
            float angle = msg.position[i];
            UpdateJoint(jointName, angle);
        }
    }
    
    void UpdateJoint(string jointName, float angle)
    {
        // Find and rotate the joint
        Transform jointTransform = transform.Find(jointName);
        if (jointTransform != null)
        {
            jointTransform.localRotation = Quaternion.Euler(0, 0, angle * Mathf.Rad2Deg);
        }
    }
}
```

---

### Creating an Interactive HRI Scene

#### Environment Setup

1. **Add Ground Plane**
   - GameObject → 3D Object → Plane
   - Scale: (10, 1, 10)
   - Material: Gray concrete

2. **Add Lighting**
   - Window → Rendering → Lighting
   - Add directional light (sun)
   - Enable shadows

3. **Add Obstacles**
   - Create cubes, cylinders as furniture
   - Add colliders for physics

#### Interactive UI Panel

Create a UI panel to display robot status:

```csharp
// RobotStatusUI.cs
using UnityEngine;
using UnityEngine.UI;
using RosMessageTypes.Sensor;

public class RobotStatusUI : MonoBehaviour
{
    [Header("UI Elements")]
    [SerializeField] Text batteryText;
    [SerializeField] Text statusText;
    [SerializeField] Slider jointAngleSlider;
    
    [Header("ROS Subscriptions")]
    private ROSConnection ros;
    
    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.Subscribe<BatteryStateMsg>("battery_state", OnBatteryUpdate);
        ros.Subscribe<JointStateMsg>("joint_states", OnJointUpdate);
    }
    
    void OnBatteryUpdate(BatteryStateMsg msg)
    {
        batteryText.text = $"Battery: {msg.percentage * 100:F1}%";
    }
    
    void OnJointUpdate(JointStateMsg msg)
    {
        // Update slider with first joint angle
        if (msg.position.Length > 0)
        {
            jointAngleSlider.value = msg.position[0] * Mathf.Rad2Deg;
        }
    }
}
```

---

### VR Teleoperation Interface

Unity enables VR-based robot control:

#### Step 1: Install XR Plugin

1. Edit → Project Settings → XR Plugin Management
2. Install OpenXR (for Meta Quest, HTC Vive)
3. Configure for your headset

#### Step 2: Create VR Controller

```csharp
// VRController.cs
using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit;
using RosMessageTypes.Geometry;

public class VRController : MonoBehaviour
{
    [SerializeField] Transform leftController;
    [SerializeField] Transform rightController;
    
    private ROSConnection ros;
    private TwistMsg twistCommand;
    
    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        twistCommand = new TwistMsg();
    }
    
    void Update()
    {
        // Map controller movement to robot commands
        Vector3 leftStick = leftController.localPosition;
        
        twistCommand.linear.x = leftStick.z;  // Forward/back
        twistCommand.angular.z = -leftStick.x;  // Turn
        
        ros.Publish("cmd_vel", twistCommand);
    }
    
    // Grab object with VR hand
    public void GrabObject(GameObject obj)
    {
        // Send grasp command to robot
        ros.SendCommandMessage("grasp_command", obj.name);
    }
}
```

---

### AR Overlay for Robot Status

Use Unity's AR Foundation for augmented reality:

#### Step 1: Install AR Foundation

Package Manager → AR Foundation → Install

#### Step 2: Create AR Session

```csharp
// ARRobotOverlay.cs
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using RosMessageTypes.Geometry;

public class ARRobotOverlay : MonoBehaviour
{
    [SerializeField] ARSessionOrigin arSession;
    [SerializeField] GameObject robotHologram;
    
    private ROSConnection ros;
    
    void Start()
    {
        ros = ROSConnection.GetOrCreateInstance();
        ros.Subscribe<PoseStampedMsg>("robot_pose", OnRobotPoseReceived);
    }
    
    void OnRobotPoseReceived(PoseStampedMsg msg)
    {
        // Place hologram at robot's real-world position
        Vector3 arPosition = new Vector3(
            msg.pose.position.x,
            msg.pose.position.y,
            msg.pose.position.z
        );
        
        robotHologram.transform.position = arPosition;
        robotHologram.SetActive(true);
        
        // Display status text above robot
        DisplayStatusText("Robot Active");
    }
    
    void DisplayStatusText(string text)
    {
        // Create 3D text floating above robot
        // Implementation depends on TextMeshPro setup
    }
}
```

---

### Connecting Unity to ROS 2

#### ROS 2 Side Setup

Create a Unity bridge node:

```python
# src/hello_robot/hello_robot/unity_bridge.py
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from sensor_msgs.msg import JointState

class UnityBridge(Node):
    def __init__(self):
        super().__init__('unity_bridge')
        
        # Publisher to Unity
        self.joint_pub = self.create_publisher(
            JointState, 'joint_states', 10
        )
        
        # Subscriber from Unity
        self.cmd_sub = self.create_subscription(
            Twist, 'cmd_vel', self.cmd_callback, 10
        )
        
        self.timer = self.create_timer(0.02, self.publish_joints)  # 50 Hz
    
    def cmd_callback(self, msg):
        self.get_logger().info(
            f'Received from Unity: linear={msg.linear.x}, angular={msg.angular.z}'
        )
    
    def publish_joints(self):
        # Publish current joint states (from robot controller)
        joint_msg = JointState()
        joint_msg.header.stamp = self.get_clock().now().to_msg()
        joint_msg.name = ['left_knee_joint', 'right_knee_joint']
        joint_msg.position = [0.5, 0.5]  # Example angles
        self.joint_pub.publish(joint_msg)

def main(args=None):
    rclpy.init(args=args)
    node = UnityBridge()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

#### Network Configuration

In Unity Editor:
1. Edit → Project Settings → ROS-TCP-Connector
2. Set ROS IP Address (your computer's IP)
3. Set ROS Port: 10000 (default)

On ROS 2 side:
```bash
# Set environment variables
export ROS_IP=192.168.1.100
export ROS_HOSTNAME=192.168.1.100

# Run bridge node
ros2 run hello_robot unity_bridge
```

---

### Building and Running

#### Build for Desktop

1. File → Build Settings
2. Platform: PC, Mac & Linux Standalone
3. Build

#### Run with ROS 2

Terminal 1 (ROS 2):
```bash
ros2 run hello_robot unity_bridge
```

Terminal 2 (Unity):
```bash
# Press Play in Unity Editor
# Or run built executable
```

---

### HRI Scenario Example: Pick and Place Collaboration

Create a scenario where human and robot work together:

```csharp
// CollaborationScenario.cs
using UnityEngine;
using UnityEngine.AI;

public class CollaborationScenario : MonoBehaviour
{
    [SerializeField] GameObject humanAvatar;
    [SerializeField] GameObject robotAgent;
    [SerializeField] GameObject targetObject;
    
    enum State { Waiting, HumanApproach, RobotPick, Handover, Complete }
    State currentState;
    
    void Update()
    {
        switch (currentState)
        {
            case State.HumanApproach:
                MoveHumanToTarget();
                break;
            case State.RobotPick:
                CommandRobotPick();
                break;
            case State.Handover:
                AnimateHandover();
                break;
        }
    }
    
    void MoveHumanToTarget()
    {
        // Navigate human avatar to object
        NavMeshAgent agent = humanAvatar.GetComponent<NavMeshAgent>();
        agent.SetDestination(targetObject.transform.position);
    }
    
    void CommandRobotPick()
    {
        // Send ROS command to pick object
        ros.Publish("pick_command", new PickCommandMsg { 
            object_name = targetObject.name 
        });
    }
}
```

---

### Summary

You've learned:
- ✅ How to set up Unity for robotics simulation
- ✅ How to import URDF robots into Unity
- ✅ How to create interactive HRI interfaces
- ✅ VR teleoperation implementation
- ✅ AR overlays for robot visualization
- ✅ ROS 2 ↔ Unity communication

---

### Exercises

1. **Import your humanoid** from Module 1 into Unity
2. **Create a UI panel** showing joint angles in real-time
3. **Build a VR scene** where you can walk around the robot
4. **Implement a collaborative task** (human points, robot moves)

---

### What's Next?

In the next chapter, you'll learn **Sensor Simulation**—how to model realistic cameras, LiDAR, IMU, and force sensors for perception algorithm development.

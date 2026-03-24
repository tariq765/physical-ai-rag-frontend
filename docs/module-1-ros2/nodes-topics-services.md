# Nodes, Topics, and Services

## ROS 2 Communication Primitives

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Create ROS 2 nodes that publish and subscribe to topics
- Implement ROS 2 services for request-response communication
- Understand when to use topics vs. services
- Build a simple multi-node system

---

### The Communication Challenge

A humanoid robot has dozens of software components that need to communicate:

```
Camera ──▶ Object Detection ──▶ Motion Planner ──▶ Leg Controller
   ▲              │                    │                  │
   │              ▼                    ▼                  ▼
LiDAR ───▶ Mapping System ─────▶ Navigation ─────▶ Arm Controller
```

How do we enable this communication reliably? ROS 2 provides two main mechanisms:
1. **Topics** — For continuous data streams (publish-subscribe)
2. **Services** — For request-response interactions

---

### Topics: Publish-Subscribe Communication

#### How Topics Work

**Topics** implement a publish-subscribe pattern:

```
┌─────────────┐      /sensor_data      ┌─────────────┐
│  Publisher  │───────────────────────▶│  Subscriber │
│   Node A    │                        │   Node B    │
└─────────────┘                        └─────────────┘
```

- **Publishers** send messages to a topic
- **Subscribers** receive messages from a topic
- Nodes don't need to know about each other (decoupled)
- Multiple publishers and subscribers can exist for the same topic

#### Topic Naming Conventions

Topics use a hierarchical naming scheme:

```
/sensors/camera/front/image_raw
/sensors/camera/front/camera_info
/sensors/lidar/points
/robot/joint_states
/robot/cmd_vel
```

**Best Practices**:
- Start with `/` for global topics
- Use snake_case (underscores, lowercase)
- Group related topics under namespaces

---

### Creating a Publisher Node

Let's create a node that publishes sensor data:

```python
# src/hello_robot/hello_robot/sensor_publisher.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SensorPublisher(Node):
    def __init__(self):
        super().__init__('sensor_publisher')
        # Create publisher to topic '/sensor_data'
        self.publisher_ = self.create_publisher(String, '/sensor_data', 10)
        # Create timer to publish every 1 second
        self.timer = self.create_timer(1.0, self.timer_callback)
        self.counter = 0
    
    def timer_callback(self):
        msg = String()
        msg.data = f'Sensor reading: {self.counter}'
        self.publisher_.publish(msg)
        self.get_logger().info(f'Published: {msg.data}')
        self.counter += 1

def main(args=None):
    rclpy.init(args=args)
    node = SensorPublisher()
    rclpy.spin(node)  # Keep node running
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

Add the entry point to `setup.py`:
```python
'sensor_publisher = hello_robot.sensor_publisher:main',
```

---

### Creating a Subscriber Node

Now create a node that subscribes to the same topic:

```python
# src/hello_robot/hello_robot/sensor_subscriber.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class SensorSubscriber(Node):
    def __init__(self):
        super().__init__('sensor_subscriber')
        # Create subscription to topic '/sensor_data'
        self.subscription = self.create_subscription(
            String,
            '/sensor_data',
            self.listener_callback,
            10
        )
    
    def listener_callback(self, msg):
        self.get_logger().info(f'Received: {msg.data}')

def main(args=None):
    rclpy.init(args=args)
    node = SensorSubscriber()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Running the System

Build and run both nodes:

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash

# Terminal 1: Run publisher
ros2 run hello_robot sensor_publisher

# Terminal 2: Run subscriber
ros2 run hello_robot sensor_subscriber
```

**Expected Output**:
```
# Publisher terminal:
[INFO] [sensor_publisher]: Published: Sensor reading: 0
[INFO] [sensor_publisher]: Published: Sensor reading: 1
...

# Subscriber terminal:
[INFO] [sensor_subscriber]: Received: Sensor reading: 0
[INFO] [sensor_subscriber]: Received: Sensor reading: 1
...
```

---

### Services: Request-Response Communication

#### How Services Work

**Services** implement a request-response pattern:

```
┌─────────────┐      Request      ┌─────────────┐
│   Client    │──────────────────▶│   Server    │
│   Node A    │                   │   Node B    │
│             │◀──────────────────│             │
└─────────────┘     Response      └─────────────┘
```

- **Client** sends a request and waits for a response
- **Server** processes the request and sends a response
- Synchronous communication (client blocks until response)

#### When to Use Services vs. Topics

| Use Topics When... | Use Services When... |
|-------------------|---------------------|
| Streaming sensor data | One-time computations |
| Continuous state updates | Configuration changes |
| Multiple subscribers needed | Request confirmation needed |
| Latest value is sufficient | All requests must be processed |

**Example in Humanoid Robot**:
- **Topics**: `/joint_states`, `/camera/image`, `/imu/data`
- **Services**: `/calculate_kinematics`, `/plan_path`, `/reset_robot`

---

### Creating a Service Server

Create a service that performs a calculation:

```python
# src/hello_robot/hello_robot/kinematics_server.py
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class KinematicsServer(Node):
    def __init__(self):
        super().__init__('kinematics_server')
        # Create service server
        self.srv = self.create_service(
            AddTwoInts, 
            '/calculate_kinematics', 
            self.callback
        )
        self.get_logger().info('Kinematics server ready')
    
    def callback(self, request, response):
        a, b = request.a, request.b
        result = a + b
        response.sum = result
        self.get_logger().info(f'Calculated: {a} + {b} = {result}')
        return response

def main(args=None):
    rclpy.init(args=args)
    node = KinematicsServer()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Creating a Service Client

Create a client that calls the service:

```python
# src/hello_robot/hello_robot/kinematics_client.py
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts

class KinematicsClient(Node):
    def __init__(self):
        super().__init__('kinematics_client')
        # Create service client
        self.client = self.create_client(AddTwoInts, '/calculate_kinematics')
        
        # Wait for service to be available
        while not self.client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Waiting for service...')
        
        # Send request
        self.send_request(5, 3)
    
    def send_request(self, a, b):
        request = AddTwoInts.Request()
        request.a = a
        request.b = b
        future = self.client.call_async(request)
        future.add_done_callback(self.response_callback)
    
    def response_callback(self, future):
        response = future.result()
        self.get_logger().info(f'Result: {response.sum}')
        rclpy.shutdown()

def main(args=None):
    rclpy.init(args=args)
    node = KinematicsClient()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Running the Service System

```bash
# Terminal 1: Run server
ros2 run hello_robot kinematics_server

# Terminal 2: Run client
ros2 run hello_robot kinematics_client
```

**Expected Output**:
```
# Server:
[INFO] [kinematics_server]: Kinematics server ready
[INFO] [kinematics_server]: Calculated: 5 + 3 = 8

# Client:
[INFO] [kinematics_client]: Waiting for service...
[INFO] [kinematics_client]: Result: 8
```

---

### Inspecting Topics and Services

Use ROS 2 CLI tools to inspect your system:

```bash
# List all topics
ros2 topic list

# Get info about a topic
ros2 topic info /sensor_data

# Echo messages on a topic (like a live subscriber)
ros2 topic echo /sensor_data

# List all services
ros2 service list

# Call a service from command line
ros2 service call /calculate_kinematics example_interfaces/srv/AddTwoInts "{a: 10, b: 20}"
```

---

### Custom Message Types

ROS 2 provides standard message types, but you can create custom ones:

Create `msg/SensorReading.msg`:
```
# SensorReading message definition
float64 temperature
float64 humidity
float64 pressure
string sensor_name
builtin_interfaces/Time timestamp
```

Update `package.xml`:
```xml
<build_depend>rosidl_default_generators</build_depend>
<exec_depend>rosidl_default_runtime</exec_depend>
<member_of_group>rosidl_interface_packages</member_of_group>
```

Update `CMakeLists.txt`:
```cmake
find_package(rosidl_default_generators REQUIRED)
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/SensorReading.msg"
)
```

---

### Summary

You've learned:
- ✅ **Topics** for publish-subscribe communication
- ✅ **Services** for request-response communication
- ✅ How to create publishers, subscribers, servers, and clients
- ✅ When to use each communication pattern
- ✅ ROS 2 CLI tools for inspection

---

### Exercises

1. **Create a custom publisher** that publishes joint angles for a humanoid arm (5 joints)
2. **Build a subscriber** that calculates and logs the average joint angle
3. **Implement a service** that takes a target position and returns joint angles (simplified inverse kinematics)
4. **Use `ros2 topic echo`** to monitor your custom topic in real-time

---

### What's Next?

In the next chapter, you'll learn **URDF for Humanoids**—how to describe the physical structure of a humanoid robot so ROS 2 can visualize and simulate it.

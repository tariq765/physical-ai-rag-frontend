# ROS 2 Basics

## Getting Started with Robot Operating System 2

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Install ROS 2 Humble Hawksbill (LTS release)
- Create and configure a ROS 2 workspace
- Understand the ROS 2 file system conventions
- Run your first ROS 2 nodes

---

### Installing ROS 2

#### Option 1: Ubuntu 22.04 (Recommended)

ROS 2 Humble Hawksbill is the Long-Term Support (LTS) release recommended for learning:

```bash
# Add ROS 2 repository
sudo apt update && sudo apt install -y curl gnupg
curl -s https://raw.githubusercontent.com/ros/rosdistro/master/ros.key | sudo apt-key add -
echo "deb http://packages.ros.org/ros2/ubuntu jammy main" | sudo tee /etc/apt/sources.list.d/ros2.list

# Install ROS 2 Desktop
sudo apt update
sudo apt install -y ros-humble-desktop

# Setup environment
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

#### Option 2: Windows with WSL2

For Windows users:
1. Install WSL2 with Ubuntu 22.04 from Microsoft Store
2. Follow Ubuntu installation steps above inside WSL2

#### Option 3: Docker (Isolated Environment)

```bash
docker pull osrf/ros:humble-desktop
docker run -it osrf/ros:humble-desktop bash
```

---

### Verifying Installation

Test your installation by running:

```bash
ros2 --version
```

You should see output indicating ROS 2 Humble.

---

### Creating Your First Workspace

ROS 2 uses a **colcon** workspace structure:

```bash
# Create workspace directories
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws

# Build the workspace (empty for now)
colcon build

# Source the workspace
source install/setup.bash
```

**Directory Structure**:
```
ros2_ws/
├── src/           # Your source code
├── build/         # Build artifacts (auto-generated)
├── install/       # Installation location (auto-generated)
└── log/           # Build logs (auto-generated)
```

---

### Your First ROS 2 Node: "Hello Robot"

Create a simple Python node:

```bash
# Navigate to src directory
cd ~/ros2_ws/src

# Create a package
ros2 pkg create --build-type ament_python hello_robot
```

Edit the main Python file at `src/hello_robot/hello_robot/hello_node.py`:

```python
import rclpy
from rclpy.node import Node

class HelloNode(Node):
    def __init__(self):
        super().__init__('hello_node')
        self.get_logger().info('Hello from ROS 2!')

def main(args=None):
    rclpy.init(args=args)
    node = HelloNode()
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

Update `setup.py` to include the entry point:

```python
from setuptools import setup

package_name = 'hello_robot'

setup(
    name=package_name,
    version='0.0.0',
    packages=[package_name],
    install_requires=['setuptools'],
    zip_safe=True,
    entry_points={
        'console_scripts': [
            'hello_node = hello_robot.hello_node:main',
        ],
    },
)
```

Build and run:

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash
ros2 run hello_robot hello_node
```

You should see: `[INFO] [hello_node]: Hello from ROS 2!`

---

### Core ROS 2 Concepts

#### 1. Node
A **node** is a computational process that performs a specific task. Think of it as a function with its own lifecycle.

Example nodes in a humanoid robot:
- `camera_driver_node` — Reads camera data
- `object_detection_node` — Identifies objects in images
- `walk_controller_node` — Generates walking motions
- `balance_node` — Maintains robot stability

#### 2. Workspace
A **workspace** is a directory where you develop ROS 2 packages. It contains:
- Source code (`src/`)
- Build files (`build/`)
- Installation files (`install/`)

#### 3. Package
A **package** is a collection of ROS 2 nodes, configuration files, and dependencies organized as a single unit.

---

### ROS 2 Command Line Tools

ROS 2 provides powerful CLI tools:

| Command | Purpose |
|---------|---------|
| `ros2 node list` | List all running nodes |
| `ros2 topic list` | List all active topics |
| `ros2 service list` | List all available services |
| `ros2 pkg list` | List all installed packages |
| `ros2 run {'<'}pkg{'>'} {'<'}node{'>'}` | Run a specific node |

Try it now:
```bash
# In terminal 1, run your node
ros2 run hello_robot hello_node

# In terminal 2, list nodes
ros2 node list
```

---

### Understanding the ROS 2 Graph

The **ROS 2 Graph** is the network of all running nodes and their connections:

```
┌─────────────┐
│   Node A    │◀──── Topic: /sensor_data
└─────────────┘
       │
       ▼ Topic: /commands
┌─────────────┐
│   Node B    │
└─────────────┘
```

Use `rqt_graph` to visualize:
```bash
sudo apt install ros-humble-rqt-graph
ros2 run rqt_graph rqt_graph
```

---

### Common Issues and Solutions

**Issue**: `ros2: command not found`
- **Solution**: Source your ROS 2 setup: `source /opt/ros/humble/setup.bash`

**Issue**: Package not found after building
- **Solution**: Source your workspace: `source install/setup.bash`

**Issue**: Import errors in Python nodes
- **Solution**: Ensure you've built the package and sourced the workspace

---

### Summary

You've now:
- ✅ Installed ROS 2 Humble
- ✅ Created a ROS 2 workspace
- ✅ Built and ran your first node
- ✅ Learned core ROS 2 terminology

---

### Exercises

1. **Install ROS 2** on your system following the appropriate method
2. **Create a workspace** and verify the build process works
3. **Modify the hello_node** to print your name instead of the default message
4. **Create a second node** that prints a different message

---

### What's Next?

In the next chapter, you'll learn about **Nodes, Topics, and Services**—the communication primitives that enable ROS 2 nodes to work together as a cohesive system.

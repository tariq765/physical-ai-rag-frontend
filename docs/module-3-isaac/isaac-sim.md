# Isaac Sim

## High-Fidelity Robot Simulation

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Install and launch NVIDIA Isaac Sim
- Import URDF robots into Isaac Sim
- Configure PhysX physics parameters
- Create synthetic data generation pipelines
- Implement sim-to-real transfer techniques

---

### What Makes Isaac Sim Different?

Isaac Sim is built on **NVIDIA Omniverse**, offering:

| Feature | Gazebo | Isaac Sim |
|---------|--------|-----------|
| Physics Engine | ODE, Bullet | PhysX 5 (GPU) |
| Rendering | OGRE | RTX Path Tracing |
| Parallel Simulation | Limited | Thousands of envs |
| Domain Randomization | Manual | Built-in |
| ROS 2 Integration | Native | Via extension |

**Key advantages for humanoids:**
- **Accurate contact physics** — Critical for walking/running
- **Parallel environments** — Train policies 1000x faster
- **Photorealistic cameras** — Better sim-to-real transfer
- **Python scripting** — Easy automation

---

### Installing Isaac Sim

#### Step 1: Install Omniverse Launcher

```bash
# Download Omniverse Launcher
wget https://install.launcher.omniverse.nvidia.com/installers/omniverse-launcher-linux.AppImage

chmod +x omniverse-launcher-linux.AppImage
./omniverse-launcher-linux.AppImage
```

#### Step 2: Install Isaac Sim

1. Open Omniverse Launcher
2. Go to **Exchange** → **Apps**
3. Find **Isaac Sim**
4. Click **Install**

#### Step 3: Configure for ROS 2

In Omniverse Launcher:
1. Isaac Sim → Settings
2. Enable **ROS 2 Extension**
3. Set ROS 2 distribution: **Humble**

---

### Launching Isaac Sim

#### GUI Mode

```bash
# Launch with GUI
./isaac-sim.sh
```

#### Headless Mode (for servers)

```bash
# Launch without display
./isaac-sim.sh --headless
```

#### With ROS 2 Bridge

```bash
# Launch with ROS 2 support
./isaac-sim.sh --ros2
```

---

### Importing Your Humanoid

#### Method 1: URDF Import (Recommended)

1. Open Isaac Sim
2. Create → Robot → Import URDF
3. Select your `simple_humanoid.urdf`
4. Configure import settings:
   - ✅ Fix Base Link (unchecked for mobile robots)
   - ✅ Merge Fixed Joints
   - ✅ Self-Collision

#### Method 2: Python Script Import

Create `import_robot.py`:

```python
import omni.kit.app
from omni.isaac.core import World
from omni.isaac.core.robots import Robot
from omni.isaac.core.utils.stage import create_new_stage

# Create new stage
create_new_stage()

# Initialize simulation world
world = World(stage_units_in_meters=1.0)

# Add ground plane
world.scene.add_default_ground_plane()

# Import robot from URDF
robot = Robot(
    prim_path="/World/Humanoid",
    name="simple_humanoid",
    usd_path=None,  # Will import from URDF
    urdf_path="/path/to/simple_humanoid.urdf",
    position=[0, 0, 0.5],  # Spawn above ground
    orientation=[0, 0, 0, 1]
)

# Run simulation
world.reset()
while True:
    world.step(render=True)
```

---

### Configuring PhysX Physics

Isaac Sim uses **PhysX 5** with GPU acceleration:

#### Physics Scene Settings

```python
from omni.isaac.core.utils.stage import get_current_stage
from pxr import PhysxSchema

def configure_physics():
    stage = get_current_stage()
    
    # Set gravity (Earth standard)
    stage.GetPrimAtPath("/World").GetAttribute("physics:gravity").Set((0, 0, -9.81))
    
    # Configure simulation parameters
    physx_scene = PhysxSchema.PhysxSceneAPI.Apply(stage.GetPrimAtPath("/World"))
    physx_scene.GetEnableCCDAttr().Set(True)  # Continuous collision detection
    physx_scene.GetEnableEnhancedDeterminismAttr().Set(True)
    physx_scene.GetMaxDepenetrationVelocityAttr().Set(10.0)
```

#### Contact-Enhanced Materials

For realistic foot-ground contact:

```python
from pxr import PhysxSchema, UsdPhysics

def create_foot_material(prim_path):
    """Create friction material for robot feet"""
    prim = stage.GetPrimAtPath(prim_path)
    
    # Apply material API
    material = UsdPhysics.MaterialAPI.Apply(prim)
    material.CreateStaticFrictionAttr().Set(1.0)
    material.CreateDynamicFrictionAttr().Set(0.8)
    material.CreateRestitutionAttr().Set(0.0)  # No bounce
    
    # Apply friction model
    friction = PhysxSchema.PhysxFrictionAPI.Apply(prim)
    friction.GetFrictionTypeAttr().Set("patch")
```

---

### Adding Sensors in Isaac Sim

#### RGB-D Camera

```python
from omni.isaac.sensor import Camera

# Add camera to robot's head
camera = Camera(
    prim_path="/World/Humanoid/head_link/camera",
    name="head_camera",
    translation=[0.05, 0, 0.05],
    orientation=[0, 0.3, 0]  # Tilted down
)

# Configure camera properties
camera.set_focal_length(24.0)
camera.set_focus_distance(1.0)
camera.set_resolution((640, 480))

# Get data
camera.initialize()
rgb_data = camera.get_rgba_data()
depth_data = camera.get_depth_data()
```

#### LiDAR

```python
from omni.isaac.sensor import Lidar

# Add 3D LiDAR
lidar = Lidar(
    prim_path="/World/Humanoid/torso_link/lidar",
    name="torso_lidar",
    translation=[0, 0, 0.15],
    configuration="Velodyne_VLP_16"  # Built-in configuration
)

# Get point cloud
lidar.initialize()
point_cloud = lidar.get_point_cloud()
```

#### IMU

```python
from omni.isaac.sensor import ImuSensor

# Add IMU to torso
imu = ImuSensor(
    prim_path="/World/Humanoid/torso_link/imu",
    name="torso_imu"
)

imu.initialize()
orientation = imu.get_orientation()
angular_velocity = imu.get_angular_velocity()
linear_acceleration = imu.get_linear_acceleration()
```

---

### ROS 2 Bridge

Isaac Sim communicates with ROS 2 via the **ROS 2 Bridge**:

#### Enable ROS 2 Bridge

In Isaac Sim GUI:
1. Window → Extensions
2. Search "ros2"
3. Enable **omni.isaac.ros2_bridge**

#### Publish Camera to ROS 2

```python
from omni.isaac.ros2_bridge import ROS2Bridge
from omni.isaac.sensor import Camera

# Create camera
camera = Camera(
    prim_path="/World/Humanoid/head_link/camera",
    name="head_camera"
)

# Create ROS 2 bridge
bridge = ROS2Bridge()

# Map Isaac Sim camera to ROS 2 topic
bridge.create_ros2_camera_publisher(
    isaac_camera=camera,
    ros_topic="/camera/image_raw",
    message_type="sensor_msgs/Image"
)
```

#### Subscribe to ROS 2 Commands

```python
from omni.isaac.ros2_bridge import ROS2Bridge
from geometry_msgs.msg import Twist

bridge = ROS2Bridge()

def cmd_callback(msg: Twist):
    """Handle velocity commands from ROS 2"""
    linear = msg.linear.x
    angular = msg.angular.z
    # Apply to robot
    robot.set_velocity(linear, angular)

bridge.create_ros2_subscriber(
    topic="/cmd_vel",
    message_type=Twist,
    callback=cmd_callback
)
```

---

### Domain Randomization

Improve sim-to-real transfer by randomizing simulation parameters:

```python
from omni.isaac.core.utils.prims import get_prim_at_path
from omni.isaac.core.utils.stage import get_current_stage
import random

class DomainRandomizer:
    def __init__(self):
        self.stage = get_current_stage()
    
    def randomize_lighting(self):
        """Randomize light intensity and color"""
        intensity = random.uniform(0.5, 2.0)
        temperature = random.uniform(4500, 7500)  # Kelvin
        
        light_prim = self.stage.GetPrimAtPath("/World/Light")
        light_prim.GetAttribute("inputs:intensity").Set(intensity)
        light_prim.GetAttribute("inputs:temperature").Set(temperature)
    
    def randomize_friction(self):
        """Randomize ground friction"""
        friction = random.uniform(0.3, 1.2)
        
        ground_prim = self.stage.GetPrimAtPath("/World/GroundPlane")
        ground_prim.GetAttribute("physics:staticFriction").Set(friction)
        ground_prim.GetAttribute("physics:dynamicFriction").Set(friction)
    
    def randomize_robot_mass(self):
        """Randomize robot link masses"""
        for link_name in ["torso_link", "thigh_link", "shin_link"]:
            mass_noise = random.uniform(-0.5, 0.5)
            prim = self.stage.GetPrimAtPath(f"/World/Humanoid/{link_name}")
            # Add mass offset
            current_mass = prim.GetAttribute("physics:mass").Get()
            prim.GetAttribute("physics:mass").Set(current_mass + mass_noise)
    
    def randomize_all(self):
        """Apply all randomizations"""
        self.randomize_lighting()
        self.randomize_friction()
        self.randomize_robot_mass()
```

---

### Synthetic Data Generation

Generate labeled training data at scale:

```python
from omni.isaac.core import World
from omni.isaac.sensor import Camera
import numpy as np
import cv2
import os

class DataGenerator:
    def __init__(self, output_dir="data"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        self.world = World()
        self.camera = Camera(
            prim_path="/World/Humanoid/head_link/camera",
            name="data_camera"
        )
        
        self.frame_count = 0
    
    def generate_dataset(self, num_samples=1000):
        """Generate RGB-D dataset with labels"""
        
        for i in range(num_samples):
            # Randomize scene
            self.randomize_scene()
            
            # Step simulation
            self.world.step(render=True)
            
            # Capture data
            rgb = self.camera.get_rgba_data()
            depth = self.camera.get_depth_data()
            segmentation = self.camera.get_semantic_segmentation_data()
            
            # Save data
            cv2.imwrite(
                f"{self.output_dir}/rgb_{i:05d}.png",
                cv2.cvtColor(rgb, cv2.COLOR_RGBA2RGB)
            )
            np.save(f"{self.output_dir}/depth_{i:05d}.npy", depth)
            np.save(f"{self.output_dir}/seg_{i:05d}.npy", segmentation)
            
            self.frame_count += 1
            
            if i % 100 == 0:
                print(f"Generated {i}/{num_samples} samples")
        
        print(f"Dataset saved to {self.output_dir}")
    
    def randomize_scene(self):
        """Randomize objects, lighting, camera angle"""
        # Implementation depends on scene setup
        pass

# Usage
generator = DataGenerator("humanoid_dataset")
generator.generate_dataset(1000)
```

---

### Parallel Environments

Train policies faster with parallel simulation:

```python
from omni.isaac.core import World
from omni.isaac.core.utils.viewports import set_camera_view
import numpy as np

class ParallelEnvironments:
    def __init__(self, num_envs=100):
        self.num_envs = num_envs
        self.world = World()
        
        # Create multiple robot instances
        self.robots = []
        for i in range(num_envs):
            robot = self.world.scene.add(
                Robot(
                    prim_path=f"/World/Robot_{i}",
                    name=f"robot_{i}",
                    urdf_path="/path/to/simple_humanoid.urdf",
                    position=[i * 2, 0, 0.5]  # Space robots apart
                )
            )
            self.robots.append(robot)
    
    def step_all(self):
        """Step all environments in parallel"""
        self.world.step(render=False)  # No rendering for speed
        
        # Collect observations from all robots
        observations = []
        for robot in self.robots:
            obs = self.get_observation(robot)
            observations.append(obs)
        
        return np.array(observations)
    
    def get_observation(self, robot):
        """Get observation from single robot"""
        # Extract joint angles, IMU, camera data
        joints = robot.get_joint_positions()
        return joints

# Usage: 100x faster training
envs = ParallelEnvironments(num_envs=100)
for episode in range(1000):
    observations = envs.step_all()
    # Train RL policy on batch of observations
```

---

### Sim-to-Real Transfer

Best practices for transferring to real hardware:

#### 1. Progressive Transfer

```python
# Start with perfect simulation
sim_config = {
    "gravity": 9.81,
    "friction": 1.0,
    "delay": 0.0,
    "noise": 0.0
}

# Gradually introduce real-world imperfections
for phase in range(5):
    sim_config["noise"] += 0.1
    sim_config["delay"] += 0.005
    sim_config["friction"] *= random.uniform(0.9, 1.1)
    
    # Retrain policy with new config
    train_policy(sim_config)
```

#### 2. System Identification

```python
def identify_robot_parameters(real_data, sim_data):
    """Find simulation parameters that match reality"""
    
    from scipy.optimize import minimize
    
    def objective(params):
        mass_offset, friction, damping = params
        
        # Run simulation with these parameters
        sim_response = run_simulation(mass_offset, friction, damping)
        
        # Compare to real data
        error = np.mean((sim_response - real_data) ** 2)
        return error
    
    # Optimize parameters
    result = minimize(
        objective,
        x0=[0, 1.0, 0.1],
        bounds=[(-1, 1), (0.1, 2.0), (0, 1.0)]
    )
    
    return result.x
```

---

### Summary

You've learned:
- ✅ Isaac Sim installation and configuration
- ✅ URDF import and PhysX setup
- ✅ Sensor simulation (camera, LiDAR, IMU)
- ✅ ROS 2 bridge for integration
- ✅ Domain randomization techniques
- ✅ Synthetic data generation
- ✅ Parallel environments for training
- ✅ Sim-to-real transfer strategies

---

### Exercises

1. **Import your humanoid** from Module 1 into Isaac Sim
2. **Add sensors** (camera, IMU) and publish to ROS 2
3. **Implement domain randomization** for robust walking
4. **Generate 100 labeled images** for object detection training

---

### What's Next?

In the next chapter, you'll learn **Isaac ROS**—GPU-accelerated perception libraries that run in real-time on robot hardware.

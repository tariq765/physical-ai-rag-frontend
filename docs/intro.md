---
title: Welcome to Physical AI & Humanoid Robotics
description: Your complete guide to embodied AI - from digital intelligence to humanoid robots
---

<div class="hero-section" style={{
  padding: '4rem 0',
  textAlign: 'center',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  borderRadius: '24px',
  marginBottom: '3rem',
  position: 'relative',
  overflow: 'hidden'
}}>
  <div style={{
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    animation: 'pulse 15s ease-in-out infinite'
  }} />
  
  <h1 style={{
    fontSize: '3.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c7d2fe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '1rem',
    position: 'relative',
    letterSpacing: '-0.02em'
  }}>
    Physical AI & Humanoid Robotics
  </h1>
  
  <p style={{
    fontSize: '1.5rem',
    color: '#94a3b8',
    maxWidth: '700px',
    margin: '0 auto 2rem',
    fontWeight: '300'
  }}>
    From Digital Intelligence to Embodied Machines
  </p>
  
  <div style={{
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  }}>
    <a 
      href="/docs/module-1-ros2/intro" 
      className="button button--primary"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        padding: '1rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
      }}
    >
      🚀 Start Learning
    </a>
    <a 
      href="/docs/quarter-overview" 
      className="button button--secondary"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        borderRadius: '12px',
        padding: '1rem 2rem',
        fontSize: '1.1rem',
        fontWeight: '600'
      }}
    >
      📋 Course Overview
    </a>
  </div>
</div>

---

## 🤖 What is Physical AI?

Physical AI refers to artificial intelligence systems that interact with the physical world through **embodied agents**—robots, drones, and humanoid machines. Unlike traditional AI that operates purely in digital spaces, Physical AI bridges the gap between software intelligence and physical action.

### Why does this matter?

The future of AI isn't just about chatbots and image generators. It's about machines that can:

<div class="feature-grid" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
  margin: '2rem 0'
}}>
  <div class="card" style={{
    padding: '1.5rem',
    borderRadius: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Navigate Environments</h3>
    <p style={{ color: '#94a3b8', margin: 0 }}>Move through real-world spaces autonomously</p>
  </div>
  
  <div class="card" style={{
    padding: '1.5rem',
    borderRadius: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤲</div>
    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Human-like Dexterity</h3>
    <p style={{ color: '#94a3b8', margin: 0 }}>Manipulate objects with precision</p>
  </div>
  
  <div class="card" style={{
    padding: '1.5rem',
    borderRadius: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Human Collaboration</h3>
    <p style={{ color: '#94a3b8', margin: 0 }}>Work safely alongside people</p>
  </div>
  
  <div class="card" style={{
    padding: '1.5rem',
    borderRadius: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Physical Learning</h3>
    <p style={{ color: '#94a3b8', margin: 0 }}>Learn from real-world interactions</p>
  </div>
</div>

---

## 📚 Learning Path

This textbook is structured into **four comprehensive modules**, each building toward a complete understanding of humanoid robotics systems:

### Module 1: ROS 2 for Humanoids
<div class="card" style={{
  padding: '1.5rem',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  margin: '1rem 0'
}}>
  <p>Learn the Robot Operating System 2 (ROS 2)—the industry-standard middleware that powers modern robots.</p>
  <ul>
    <li><strong>Nodes, topics, and services</strong>—the building blocks of robot software</li>
    <li><strong>URDF</strong> for modeling humanoid robots</li>
    <li><strong>Communication patterns</strong> for distributed robot systems</li>
  </ul>
  <a href="/docs/module-1-ros2/intro" className="button button--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Module 1 →</a>
</div>

### Module 2: Digital Twin
<div class="card" style={{
  padding: '1.5rem',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  margin: '1rem 0'
}}>
  <p>Create virtual replicas of physical robots for safe testing and development.</p>
  <ul>
    <li><strong>Gazebo physics simulation</strong> for realistic robot behavior</li>
    <li><strong>Unity integration</strong> for human-robot interaction studies</li>
    <li><strong>Sensor simulation</strong> for cameras, LiDAR, and IMUs</li>
  </ul>
  <a href="/docs/module-2-digital-twin/intro" className="button button--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Module 2 →</a>
</div>

### Module 3: NVIDIA Isaac
<div class="card" style={{
  padding: '1.5rem',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  margin: '1rem 0'
}}>
  <p>Explore NVIDIA's powerful robotics platform for simulation and deployment.</p>
  <ul>
    <li><strong>Isaac Sim</strong> for high-fidelity simulation</li>
    <li><strong>Isaac ROS</strong> for GPU-accelerated perception</li>
    <li><strong>Nav2</strong> for autonomous navigation</li>
  </ul>
  <a href="/docs/module-3-isaac/intro" className="button button--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Module 3 →</a>
</div>

### Module 4: Vision-Language-Action (VLA)
<div class="card" style={{
  padding: '1.5rem',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  border: '1px solid rgba(102, 126, 234, 0.2)',
  margin: '1rem 0'
}}>
  <p>Connect human language to robot actions—the cutting edge of humanoid AI.</p>
  <ul>
    <li><strong>Voice-to-action</strong> systems for natural command interfaces</li>
    <li><strong>LLM-based task planning</strong> for complex behaviors</li>
    <li><strong>Capstone project</strong> integrating all concepts</li>
  </ul>
  <a href="/docs/module-4-vla/intro" className="button button--primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Explore Module 4 →</a>
</div>

---

## 👥 Who This Book Is For

<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  margin: '2rem 0'
}}>
  <div class="card" style={{
    padding: '1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
    <h4 style={{ marginBottom: '0.25rem' }}>Students</h4>
    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Entering robotics from CS or engineering</p>
  </div>
  
  <div class="card" style={{
    padding: '1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💻</div>
    <h4 style={{ marginBottom: '0.25rem' }}>Developers</h4>
    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Transitioning from software to embodied AI</p>
  </div>
  
  <div class="card" style={{
    padding: '1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔬</div>
    <h4 style={{ marginBottom: '0.25rem' }}>Researchers</h4>
    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Exploring humanoid robot platforms</p>
  </div>
  
  <div class="card" style={{
    padding: '1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
    <h4 style={{ marginBottom: '0.25rem' }}>Enthusiasts</h4>
    <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>Understanding the future of robotics</p>
  </div>
</div>

> **No prior robotics experience required.** We start from fundamentals and build up systematically.

---

## 🎯 How to Use This Book

1. **Read sequentially** — Each module builds on previous concepts
2. **Follow the examples** — Code and configurations are provided throughout
3. **Experiment** — Use the simulation tools to test your understanding
4. **Build the capstone** — Module 4 brings everything together in a complete project

---

## 🔮 The Future of Humanoid Robotics

We stand at the threshold of a revolution. Humanoid robots are transitioning from research labs to real-world applications:

| Industry | Application |
|----------|-------------|
| 🏭 **Manufacturing** | Humanoid workers collaborating alongside humans |
| 🏥 **Healthcare** | Robotic assistants for patient care and logistics |
| 🏠 **Home** | General-purpose robots for household tasks |
| 🛰️ **Exploration** | Robots operating in environments designed for humans |

---

<div style={{
  textAlign: 'center',
  padding: '3rem 0',
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  borderRadius: '24px',
  marginTop: '3rem'
}}>
  <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Begin?</h2>
  <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2rem' }}>
    Your journey from digital intelligence to embodied machines starts here.
  </p>
  <a 
    href="/docs/module-1-ros2/intro" 
    className="button button--primary"
    style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem 2.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
    }}
  >
    Start Module 1 →
  </a>
</div>

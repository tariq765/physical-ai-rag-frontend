# LLM-Based Planning

## Using Language Models for Task Decomposition

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Integrate LLMs for robot task planning
- Implement SayCan architecture
- Generate executable code from language
- Handle long-horizon task decomposition
- Validate plans with affordance functions

---

### Why LLMs for Planning?

Traditional task planning requires explicit programming:

```python
# Traditional: Manual task decomposition
def make_coffee():
    grasp_coffee_pod()
    insert_into_machine()
    press_button()
    wait_for_brew()
    grasp_cup()
    place_under_spout()
```

LLM-based planning generates plans automatically:

```
Human: "Make me a coffee"
         │
         ▼
┌─────────────────┐
│     LLM         │
│  (GPT-4, Llama) │
└─────────────────┘
         │
         ▼
Plan:
1. Locate coffee pods
2. Pick up coffee pod
3. Insert into machine
4. Press start button
5. Wait 30 seconds
6. Pick up cup
7. Place under spout
```

---

### SayCan Architecture

Google's **SayCan** combines LLMs with affordance functions:

```
┌─────────────────────────────────────────────────────────┐
│                   SayCan Architecture                    │
├─────────────────────────────────────────────────────────┤
│  Language Model  │  "What steps are needed to..."      │
│  (LLM)           │  → High-level plan                   │
├─────────────────────────────────────────────────────────┤
│  Affordance      │  "Can I do this step now?"          │
│  Functions       │  → Success probability               │
├─────────────────────────────────────────────────────────┤
│  Selection       │  Choose highest scoring action       │
└─────────────────────────────────────────────────────────┘
```

**Formula:**
```
Score(action) = P_LLM(action | task) × P_affordance(action)
```

---

### Setting Up LLM Integration

#### Option 1: OpenAI GPT API

```python
# llm_planner_openai.py
import openai
from typing import List, Dict

class OpenAIPlanner:
    def __init__(self, api_key: str):
        openai.api_key = api_key
        self.model = "gpt-4"
        
        # Robot skill prompt
        self.system_prompt = """
You are a robot planning assistant. Given a task, break it down into 
executable robot actions. 

Available actions:
- navigate_to(location)
- pick_up(object)
- place_on(object, location)
- open(container)
- close(container)
- pour(source, destination)
- wait(seconds)
- wave()
- look_at(target)
- stop()

Respond with a JSON list of actions.
"""
    
    def generate_plan(self, task: str) -> List[Dict]:
        """Generate plan from natural language task"""

        # Build messages avoiding MDX curly brace interpretation
        system_key = "system"
        user_key = "user"
        content_key = "content"
        
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                dict([(system_key, "system"), (content_key, self.system_prompt)]),
                dict([(user_key, "user"), (content_key, f"Task: {task}")])
            ],
            temperature=0.1,  # Low temperature for consistency
            max_tokens=500
        )
        
        plan_text = response.choices[0].message.content
        
        # Parse JSON response
        import json
        plan = json.loads(plan_text)
        
        return plan

# Usage
planner = OpenAIPlanner(api_key="your-api-key")
task = "Clean up the toys and put them in the box"
plan = planner.generate_plan(task)

for i, step in enumerate(plan, 1):
    print(f"{i}. {step}")
```

#### Option 2: Local Llama Model (Free, Private)

```python
# llm_planner_llama.py
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class LlamaPlanner:
    def __init__(self, model_name="meta-llama/Llama-2-7b-chat-hf"):
        # Load tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        
        self.prompt_template = """
### System: You are a robot planning assistant.
### Available actions: navigate_to, pick_up, place_on, open, close, pour, wait, wave, look_at, stop

### User: {task}
### Assistant: Here's the plan:
"""
    
    def generate_plan(self, task: str, max_steps: int = 10) -> List[str]:
        """Generate plan using local Llama model"""
        
        prompt = self.prompt_template.format(task=task)
        
        # Tokenize
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=200,
                temperature=0.1,
                do_sample=True,
                top_p=0.9
            )
        
        # Decode
        plan_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Parse steps from response
        steps = self._parse_steps(plan_text)
        
        return steps[:max_steps]
    
    def _parse_steps(self, text: str) -> List[str]:
        """Extract action steps from LLM response"""
        import re
        
        # Find numbered steps
        pattern = r'\d+\.\s*(.+)'
        matches = re.findall(pattern, text)
        
        return [m.strip() for m in matches]

# Usage (requires HuggingFace access)
planner = LlamaPlanner()
task = "Bring me a glass of water"
plan = planner.generate_plan(task)
print(plan)
```

---

### SayCan Implementation

Complete SayCan architecture with affordance functions:

```python
# saycan_planner.py
import openai
import json
from typing import List, Dict, Tuple

class SayCanPlanner:
    def __init__(self, api_key: str):
        openai.api_key = api_key
        
        # Define available skills with affordance functions
        self.skills = {
            'navigate_to': {
                'description': 'Move to a location',
                'affordance': self._affordance_navigate
            },
            'pick_up': {
                'description': 'Pick up an object',
                'affordance': self._affordance_pick
            },
            'place_on': {
                'description': 'Place object on surface',
                'affordance': self._affordance_place
            },
            'open': {
                'description': 'Open a container',
                'affordance': self._affordance_open
            },
            'close': {
                'description': 'Close a container',
                'affordance': self._affordance_close
            }
        }
        
        self.system_prompt = """
You are a robot planning assistant. Given a task, suggest the next best action.

Available actions:
- navigate_to(location): Move to a location
- pick_up(object): Pick up an object
- place_on(object, location): Place object on surface
- open(container): Open a container
- close(container): Close a container

Task: {task}
Current state: {state}

What should the robot do next? Respond with ONE action in JSON:
{{"action": "action_name", "args": {{}}}}
"""
    
    def _affordance_navigate(self, location: str, current_state: dict) -> float:
        """Can robot navigate to this location?"""
        # Check if location is known
        if location not in current_state.get('known_locations', []):
            return 0.1
        
        # Check if path is clear
        if current_state.get('path_blocked', False):
            return 0.2
        
        # Check battery
        if current_state.get('battery', 100) < 20:
            return 0.3
        
        return 0.9
    
    def _affordance_pick(self, object_name: str, current_state: dict) -> float:
        """Can robot pick up this object?"""
        # Check if object is visible
        if object_name not in current_state.get('visible_objects', []):
            return 0.1
        
        # Check if gripper is free
        if current_state.get('gripper_occupied', False):
            return 0.1
        
        # Check if object is reachable
        if not current_state.get('object_reachable', True):
            return 0.3
        
        return 0.9
    
    def _affordance_place(self, object_name: str, location: str, 
                          current_state: dict) -> float:
        """Can robot place object here?"""
        # Must be holding something
        if not current_state.get('gripper_occupied', False):
            return 0.1
        
        # Check if location is reachable
        if location not in current_state.get('reachable_surfaces', []):
            return 0.2
        
        return 0.9
    
    def _affordance_open(self, container: str, current_state: dict) -> float:
        """Can robot open this container?"""
        if container not in current_state.get('visible_objects', []):
            return 0.1
        
        if current_state.get('gripper_occupied', False):
            return 0.1
        
        if current_state.get(f'{container}_already_open', False):
            return 0.1
        
        return 0.8
    
    def _affordance_close(self, container: str, current_state: dict) -> float:
        """Can robot close this container?"""
        if container not in current_state.get('visible_objects', []):
            return 0.1
        
        return 0.8
    
    def get_next_action(self, task: str, current_state: dict) -> Tuple[str, dict, float]:
        """Get next best action using SayCan scoring"""
        
        # Get candidate actions from LLM
        candidates = self._get_candidate_actions(task, current_state)
        
        # Score each action
        scored_actions = []
        for action in candidates:
            # LLM probability (simplified as ranking)
            llm_score = 1.0 / (candidates.index(action) + 1)
            
            # Affordance score
            affordance_fn = self.skills.get(action['action'], {}).get('affordance')
            if affordance_fn:
                affordance_score = affordance_fn(**action['args'], current_state=current_state)
            else:
                affordance_score = 0.5
            
            # Combined score
            combined_score = llm_score * affordance_score
            scored_actions.append((action, combined_score))
        
        # Select best action
        best_action, best_score = max(scored_actions, key=lambda x: x[1])
        
        return best_action, best_score
    
    def _get_candidate_actions(self, task: str, current_state: dict) -> List[dict]:
        """Get candidate actions from LLM"""
        
        prompt = self.system_prompt.format(
            task=task,
            state=json.dumps(current_state)
        )
        
        # Build messages avoiding MDX curly brace interpretation
        user_key = "user"
        content_key = "content"
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[dict([(user_key, "user"), (content_key, prompt)])],
            temperature=0.1,
            max_tokens=200,
            n=5  # Get 5 candidates
        )
        
        candidates = []
        for choice in response.choices:
            try:
                action = json.loads(choice.message.content)
                candidates.append(action)
            except:
                continue
        
        return candidates
    
    def execute_plan(self, task: str, max_steps: int = 10):
        """Execute complete SayCan planning loop"""
        
        current_state = {
            'known_locations': ['kitchen', 'bedroom', 'living_room'],
            'visible_objects': ['cup', 'book', 'box'],
            'reachable_surfaces': ['table', 'shelf'],
            'gripper_occupied': False,
            'battery': 80,
            'path_blocked': False
        }
        
        print(f"Task: {task}")
        print("-" * 40)
        
        for step in range(max_steps):
            # Get next action
            action, score = self.get_next_action(task, current_state)
            
            print(f"Step {step + 1}: {action['action']} (score: {score:.2f})")
            
            # Execute action (simulated)
            self._execute_action(action, current_state)
            
            # Check if task is complete
            if self._is_task_complete(task, current_state):
                print("Task complete!")
                break
        
        print("-" * 40)
    
    def _execute_action(self, action: dict, current_state: dict):
        """Execute action and update state"""
        # Simulated execution
        if action['action'] == 'pick_up':
            current_state['gripper_occupied'] = True
        elif action['action'] == 'place_on':
            current_state['gripper_occupied'] = False
    
    def _is_task_complete(self, task: str, current_state: dict) -> bool:
        """Check if task is complete"""
        # Simplified completion check
        return False  # Would implement proper checking

# Usage
planner = SayCanPlanner(api_key="your-api-key")
planner.execute_plan("Pick up the cup and place it on the table")
```

---

### Code as Policies

Let LLMs generate executable robot code:

```python
import openai

class CodeAsPolicies:
    def __init__(self, api_key: str):
        openai.api_key = api_key
        
        # The prompt template includes a code example
        # Using chr(96) to avoid MDX parsing issues with backticks
        backtick = chr(96)
        triple_backtick = backtick * 3
        
        self.prompt_template = f"""
Generate Python code for a robot to complete this task: {{task}}

Available robot API:
{triple_backtick}python
class Robot:
    def move_to(self, x: float, y: float, z: float)
    def pick_up(self, object_name: str)
    def place_on(self, object_name: str, surface: str)
    def open(self, container: str)
    def close(self, container: str)
    def wait(self, seconds: int)
    def get_position(self, object_name: str) -> Tuple[float, float, float]
    def detect_objects(self) -> List[str]
{triple_backtick}

Generate a function called execute_task(robot: Robot) that completes the task.
"""
    
    def generate_policy(self, task: str) -> str:
        """Generate executable policy code"""

        prompt = self.prompt_template.format(task=task)

        # Build messages list (avoiding MDX curly brace issues)
        role_key = "role"
        content_key = "content"
        # Build dict using dict() to avoid MDX issues
        messages = [dict([(role_key, "user"), (content_key, prompt)])]

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            temperature=0.1,
            max_tokens=1000
        )

        response_code = response.choices[0].message.content

        # Extract code from markdown
        import re
        # Use raw string pattern to match triple backticks
        pattern = chr(96) + chr(96) + chr(96) + r'python(.+?)' + chr(96) + chr(96) + chr(96)
        code_match = re.search(pattern, response_code, re.DOTALL)
        if code_match:
            response_code = code_match.group(1)

        return response_code
    
    def execute_generated_code(self, task: str, robot):
        """Generate and execute policy"""

        generated_code = self.generate_policy(task)
        print("Generated code:\\n" + generated_code)

        # Create execution environment using dict() to avoid MDX issues
        exec_env = dict([("robot", robot)])

        # Execute generated code
        try:
            exec(generated_code, exec_env)
            exec_env['execute_task'](robot)
        except Exception as e:
            print("Execution error: " + str(e))

# Usage
class SimulatedRobot:
    def move_to(self, x, y, z):
        print(f"Moving to ({x}, {y}, {z})")
    
    def pick_up(self, obj):
        print(f"Picking up {obj}")
    
    def place_on(self, obj, surface):
        print(f"Placing {obj} on {surface}")
    
    def wait(self, seconds):
        print(f"Waiting {seconds} seconds")
    
    def get_position(self, obj):
        return (0.5, 0.3, 0.0)
    
    def detect_objects(self):
        return ['cup', 'book', 'box']

robot = SimulatedRobot()
planner = CodeAsPolicies(api_key="your-api-key")
planner.execute_generated_code("Pick up the cup and place it on the table", robot)
```

---

### Long-Horizon Task Planning

Handle complex multi-step tasks:

```python
# long_horizon_planner.py
import json

class LongHorizonPlanner:
    def __init__(self, api_key: str):
        self.api_key = api_key
        
        self.subtask_prompt = """
Break this task into major subtasks: {task}

Each subtask should be a significant milestone.
Respond as JSON list:
[
  {{"subtask": "...", "success_condition": "..."}},
  ...
]
"""
    
    def decompose_task(self, task: str) -> List[Dict]:
        """Decompose task into subtasks"""
        import openai

        # Build message avoiding MDX curly brace interpretation
        user_key = "user"
        content_key = "content"
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[dict([(user_key, "user"), (content_key, self.subtask_prompt.format(task=task))])],
            temperature=0.1
        )
        
        subtasks = json.loads(response.choices[0].message.content)
        return subtasks
    
    def execute_hierarchical(self, task: str):
        """Execute task hierarchically"""
        
        # Decompose into subtasks
        subtasks = self.decompose_task(task)
        
        print(f"Task: {task}")
        print(f"Subtasks: {len(subtasks)}")
        print("-" * 40)
        
        for i, subtask in enumerate(subtasks, 1):
            print(f"\nSubtask {i}: {subtask['subtask']}")
            print(f"Success when: {subtask['success_condition']}")
            
            # Execute subtask (would use SayCan or Code-as-Policies)
            success = self._execute_subtask(subtask)
            
            if not success:
                print("Subtask failed! Attempting recovery...")
                self._recover_from_failure(subtask)
    
    def _execute_subtask(self, subtask: Dict) -> bool:
        """Execute single subtask"""
        # Would integrate with lower-level planners
        return True
    
    def _recover_from_failure(self, subtask: Dict):
        """Recovery from subtask failure"""
        # Ask LLM for alternative approach
        import openai
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{
                "role": "user",
                "content": f"Failed to: {subtask['subtask']}. Suggest alternative approach."
            }]
        )
        
        print(f"Recovery suggestion: {response.choices[0].message.content}")

# Usage
planner = LongHorizonPlanner(api_key="your-api-key")
planner.execute_hierarchical("Clean up the living room and prepare for guests")
```

---

### Validation and Safety

Ensure LLM plans are safe and executable:

```python
# plan_validator.py
class PlanValidator:
    def __init__(self):
        self.safety_rules = [
            self._check_collision_free,
            self._check_reachability,
            self._check_payload_limits,
            self._check_battery_sufficient
        ]
    
    def validate_plan(self, plan: List[Dict], current_state: dict) -> Tuple[bool, str]:
        """Validate plan for safety and feasibility"""
        
        for action in plan:
            for rule in self.safety_rules:
                is_valid, message = rule(action, current_state)
                if not is_valid:
                    return False, message
        
        return True, "Plan validated"
    
    def _check_collision_free(self, action: dict, state: dict) -> Tuple[bool, str]:
        """Check if action causes collision"""
        # Would use collision checker
        return True, "No collision"
    
    def _check_reachability(self, action: dict, state: dict) -> Tuple[bool, str]:
        """Check if target is reachable"""
        # Would use kinematics solver
        return True, "Reachable"
    
    def _check_payload_limits(self, action: dict, state: dict) -> Tuple[bool, str]:
        """Check weight limits"""
        max_payload = 5.0  # kg
        
        if action['action'] == 'pick_up':
            object_weight = state.get('object_weights', {}).get(action['args']['object'], 0)
            if object_weight > max_payload:
                return False, f"Object too heavy: {object_weight}kg > {max_payload}kg"
        
        return True, "Within payload limits"
    
    def _check_battery_sufficient(self, action: dict, state: dict) -> Tuple[bool, str]:
        """Check battery for action"""
        battery_required = {
            'navigate_to': 5,
            'pick_up': 2,
            'place_on': 2
        }
        
        required = battery_required.get(action['action'], 1)
        current = state.get('battery', 0)
        
        if current < required:
            return False, f"Insufficient battery: {current}% < {required}%"
        
        return True, "Battery sufficient"

# Usage in planning loop
validator = PlanValidator()

plan = planner.generate_plan(task)
is_valid, message = validator.validate_plan(plan, current_state)

if not is_valid:
    print(f"Plan invalid: {message}")
    # Request alternative plan
else:
    print("Plan validated, executing...")
```

---

### Summary

You've learned:
- ✅ LLM integration for task planning
- ✅ SayCan architecture with affordance functions
- ✅ Code-as-Policies approach
- ✅ Long-horizon task decomposition
- ✅ Plan validation and safety

---

### Exercises

1. **Implement OpenAI planner** for your robot
2. **Add affordance functions** for your robot's capabilities
3. **Create Code-as-Policies** generator
4. **Test with complex tasks** (5+ steps)

---

### What's Next?

In the next chapter, you'll integrate everything into a **complete VLA system** for your humanoid robot.

# Voice to Action

## Speech Recognition for Robot Commands

---

### Chapter Objectives

By the end of this chapter, you will be able to:
- Implement speech-to-text for robot commands
- Parse natural language into structured commands
- Handle command ambiguity and clarification
- Build voice-controlled robot interfaces

---

### Speech Recognition Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Audio     │────▶│   Speech-   │────▶│   Text      │
│   Input     │     │   to-Text   │     │   Command   │
└─────────────┘     └─────────────┘     └─────────────┘
   Microphone          Whisper/           "Pick up
                       Google             the cup"
```

---

### Option 1: OpenAI Whisper (Local, Accurate)

#### Installation

```bash
pip install openai-whisper
pip install torch torchvision torchaudio
```

#### Basic Speech Recognition

```python
# speech_recognition.py
import whisper
import numpy as np
import sounddevice as sd
from scipy.io.wavfile import write

class SpeechRecognizer:
    def __init__(self, model_size="base"):
        # Load Whisper model
        # Options: tiny, base, small, medium, large
        self.model = whisper.load_model(model_size)
        self.sample_rate = 16000
    
    def record_audio(self, duration=5):
        """Record audio from microphone"""
        print("Recording...")
        audio = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1
        )
        sd.wait()
        print("Recording complete")
        return audio.flatten()
    
    def save_audio(self, audio, filename="temp.wav"):
        """Save audio to WAV file"""
        write(filename, self.sample_rate, audio)
    
    def transcribe(self, audio_file="temp.wav"):
        """Transcribe audio to text"""
        result = self.model.transcribe(audio_file)
        return result["text"]
    
    def listen_and_transcribe(self, duration=5):
        """Record and transcribe in one step"""
        audio = self.record_audio(duration)
        self.save_audio(audio)
        return self.transcribe()

# Usage
recognizer = SpeechRecognizer(model_size="base")
command = recognizer.listen_and_transcribe(duration=5)
print(f"You said: {command}")
```

#### Real-Time Streaming

```python
# real_time_recognition.py
import whisper
import sounddevice as sd
import numpy as np
from collections import deque

class StreamingRecognizer:
    def __init__(self, model_size="base"):
        self.model = whisper.load_model(model_size)
        self.sample_rate = 16000
        self.chunk_size = 3000  # 3 seconds at 16kHz
        self.audio_buffer = deque(maxlen=10)
    
    def callback(self, indata, frames, time, status):
        """Audio stream callback"""
        if status:
            print(status)
        self.audio_buffer.append(indata.copy())
    
    def process_buffer(self):
        """Process accumulated audio"""
        if len(self.audio_buffer) < 3:
            return None
        
        # Concatenate audio chunks
        audio = np.concatenate(list(self.audio_buffer))
        
        # Transcribe
        result = self.model.transcribe(audio)
        
        # Clear buffer
        self.audio_buffer.clear()
        
        return result["text"]
    
    def start_listening(self):
        """Start real-time listening"""
        print("Listening for commands (Ctrl+C to stop)...")
        
        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            callback=self.callback
        ):
            try:
                while True:
                    text = self.process_buffer()
                    if text:
                        print(f"Command: {text}")
            except KeyboardInterrupt:
                print("\nStopping...")

# Usage
recognizer = StreamingRecognizer()
recognizer.start_listening()
```

---

### Option 2: Google Speech API (Cloud, Multi-language)

```python
# google_speech.py
import speech_recognition as sr

class GoogleSpeechRecognizer:
    def __init__(self, language="en-US"):
        self.recognizer = sr.Recognizer()
        self.language = language
    
    def listen_from_microphone(self):
        """Listen from microphone"""
        with sr.Microphone() as source:
            print("Adjusting for ambient noise...")
            self.recognizer.adjust_for_ambient_noise(source)
            print("Listening...")
            audio = self.recognizer.listen(source)
        return audio
    
    def recognize(self, audio):
        """Recognize speech using Google"""
        try:
            text = self.recognizer.recognize_google(
                audio,
                language=self.language
            )
            return text
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Error: {e}"
    
    def listen_and_recognize(self):
        """Full pipeline"""
        audio = self.listen_from_microphone()
        return self.recognize(audio)

# Usage
recognizer = GoogleSpeechRecognizer()
command = recognizer.listen_and_recognize()
print(f"You said: {command}")
```

---

### Command Parsing

Convert transcribed text to structured robot commands:

```python
# command_parser.py
import re
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class RobotCommand:
    action: str
    target: Optional[str] = None
    location: Optional[str] = None
    parameters: dict = None
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}

class CommandParser:
    def __init__(self):
        # Action patterns
        self.action_patterns = {
            'pick': r'\b(pick|grab|take)\b',
            'place': r'\b(place|put|set)\b',
            'move': r'\b(move|go|walk)\b',
            'navigate': r'\b(navigate|go to|walk to)\b',
            'look': r'\b(look|turn|face)\b',
            'wave': r'\b(wave|greet)\b',
            'stop': r'\b(stop|halt|freeze)\b'
        }
        
        # Location patterns
        self.location_patterns = {
            'table': r'\b(table|desk)\b',
            'floor': r'\b(floor|ground)\b',
            'shelf': r'\b(shelf|rack)\b',
            'left': r'\b(left|left side)\b',
            'right': r'\b(right|right side)\b',
            'front': r'\b(front|ahead)\b',
            'behind': r'\b(behind|back)\b'
        }
        
        # Object colors
        self.color_patterns = {
            'red': r'\b(red|crimson)\b',
            'blue': r'\b(blue|navy)\b',
            'green': r'\b(green|emerald)\b',
            'yellow': r'\b(yellow|gold)\b',
            'black': r'\b(black|dark)\b',
            'white': r'\b(white|light)\b'
        }
    
    def parse(self, text: str) -> RobotCommand:
        """Parse natural language to robot command"""
        
        text = text.lower().strip()
        
        # Detect action
        action = None
        for act, pattern in self.action_patterns.items():
            if re.search(pattern, text):
                action = act
                break
        
        if not action:
            return RobotCommand(action='unknown')
        
        # Detect target object
        target = self._extract_target(text)
        
        # Detect location
        location = self._extract_location(text)
        
        # Detect color
        color = self._extract_color(text)
        
        # Build parameters
        parameters = {}
        if color:
            parameters['color'] = color
        
        return RobotCommand(
            action=action,
            target=target,
            location=location,
            parameters=parameters
        )
    
    def _extract_target(self, text: str) -> Optional[str]:
        """Extract target object from text"""
        # Simple noun extraction (can be improved with NLP)
        nouns = ['cup', 'bottle', 'box', 'block', 'ball', 'book', 'phone']
        for noun in nouns:
            if noun in text:
                return noun
        return None
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text"""
        for loc, pattern in self.location_patterns.items():
            if re.search(pattern, text):
                return loc
        return None
    
    def _extract_color(self, text: str) -> Optional[str]:
        """Extract color from text"""
        for color, pattern in self.color_patterns.items():
            if re.search(pattern, text):
                return color
        return None

# Usage
parser = CommandParser()

commands = [
    "Pick up the red cup",
    "Move to the table",
    "Place the blue block on the shelf",
    "Look left",
    "Stop"
]

for cmd_text in commands:
    cmd = parser.parse(cmd_text)
    print(f"'{cmd_text}' → {cmd}")
```

---

### Handling Ambiguity

When commands are unclear, ask for clarification:

```python
# clarification_handler.py
class ClarificationHandler:
    def __init__(self):
        self.clarification_questions = {
            'multiple_objects': "I see multiple objects. Which one should I pick?",
            'unclear_location': "Where should I place it?",
            'unknown_object': "I don't see that object. Can you describe it?",
            'ambiguous_action': "I'm not sure what you want. Can you rephrase?"
        }
    
    def needs_clarification(self, command: RobotCommand) -> bool:
        """Check if command needs clarification"""
        if command.action == 'unknown':
            return True
        if command.action in ['pick', 'place'] and not command.target:
            return True
        if command.action == 'place' and not command.location:
            return True
        return False
    
    def get_clarification(self, issue: str) -> str:
        """Get clarification question"""
        return self.clarification_questions.get(
            issue, "Can you clarify?"
        )
    
    def handle_ambiguous_objects(self, objects: List[str]) -> str:
        """Handle multiple possible objects"""
        return f"I found: {', '.join(objects)}. Which one?"

# Usage in main loop
handler = ClarificationHandler()

command = parser.parse("Pick up the cup")
if handler.needs_clarification(command):
    question = handler.get_clarification('unclear_location')
    print(f"Robot: {question}")
    # Wait for user response
```

---

### Complete Voice Command System

```python
# voice_command_system.py
import rclpy
from rclpy.node import Node
from speech_recognizer import SpeechRecognizer
from command_parser import CommandParser, RobotCommand
from geometry_msgs.msg import Twist
from std_msgs.msg import String

class VoiceCommandNode(Node):
    def __init__(self):
        super().__init__('voice_command_node')
        
        # Initialize components
        self.recognizer = SpeechRecognizer(model_size="base")
        self.parser = CommandParser()
        
        # ROS 2 publishers
        self.cmd_pub = self.create_publisher(
            Twist, '/cmd_vel', 10
        )
        self.status_pub = self.create_publisher(
            String, '/robot/status', 10
        )
        
        # Command timer
        self.timer = self.create_timer(0.5, self.listen_loop)
        
        self.get_logger().info('Voice command system ready')
    
    def listen_loop(self):
        """Main listening loop"""
        try:
            # Listen for command
            self.get_logger().info('Listening...')
            text = self.recognizer.listen_and_transcribe(duration=5)
            
            if not text.strip():
                return
            
            self.get_logger().info(f'Heard: "{text}"')
            
            # Parse command
            command = self.parser.parse(text)
            self.get_logger().info(f'Parsed: {command}')
            
            # Execute command
            self.execute_command(command)
            
        except Exception as e:
            self.get_logger().error(f'Error: {e}')
    
    def execute_command(self, command: RobotCommand):
        """Execute parsed robot command"""
        
        twist = Twist()
        status = String()
        
        if command.action == 'move':
            if command.location == 'forward':
                twist.linear.x = 0.3
                status.data = "Moving forward"
            elif command.location == 'backward':
                twist.linear.x = -0.3
                status.data = "Moving backward"
        
        elif command.action == 'navigate':
            status.data = f"Navigating to {command.location}"
            # Would trigger navigation stack
        
        elif command.action == 'look':
            if command.location == 'left':
                twist.angular.z = 0.3
                status.data = "Turning left"
            elif command.location == 'right':
                twist.angular.z = -0.3
                status.data = "Turning right"
        
        elif command.action == 'stop':
            twist.linear.x = 0.0
            twist.angular.z = 0.0
            status.data = "Stopping"
        
        elif command.action == 'pick':
            status.data = f"Picking up {command.target}"
            # Would trigger manipulation pipeline
        
        elif command.action == 'place':
            status.data = f"Placing {command.target} on {command.location}"
            # Would trigger manipulation pipeline
        
        else:
            status.data = f"Unknown command: {command.action}"
        
        # Publish commands
        self.cmd_pub.publish(twist)
        self.status_pub.publish(status)

def main(args=None):
    rclpy.init(args=args)
    node = VoiceCommandNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

---

### Multi-Language Support

```python
# multi_language_support.py
class MultiLanguageParser:
    def __init__(self):
        self.parsers = {
            'en': CommandParser(),  # English
            'es': CommandParser(),  # Spanish
            'fr': CommandParser(),  # French
            'de': CommandParser(),  # German
            'zh': CommandParser(),  # Chinese
        }
        
        # Language-specific patterns would be added here
    
    def parse(self, text: str, language: str = 'en') -> RobotCommand:
        """Parse command in specified language"""
        parser = self.parsers.get(language, self.parsers['en'])
        return parser.parse(text)

# Usage with language detection
from langdetect import detect

def detect_and_parse(text: str) -> RobotCommand:
    lang = detect(text)  # Detect language
    parser = MultiLanguageParser()
    return parser.parse(text, lang)
```

---

### Summary

You've learned:
- ✅ Speech-to-text with Whisper and Google API
- ✅ Command parsing from natural language
- ✅ Handling ambiguity and clarification
- ✅ Complete voice command ROS 2 node
- ✅ Multi-language support

---

### Exercises

1. **Implement Whisper** speech recognition for your robot
2. **Extend the parser** with 10 new command types
3. **Add clarification dialog** for ambiguous commands
4. **Test with real voice commands** in noisy environments

---

### What's Next?

In the next chapter, you'll learn **LLM-Based Planning**—using large language models to decompose complex tasks into executable robot actions.

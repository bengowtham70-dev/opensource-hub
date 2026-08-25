---
name: godot-4-desktop-app
description: Build desktop applications with Godot 4.6, GDScript, Jolt Physics, and AI integration via OpenRouter/HuggingFace APIs
version: 1.0.0
---

# Godot 4.6 Desktop App Development

## Purpose
Build high-performance desktop applications with 3D visualization, physics simulation, and AI integration using Godot 4.6 and GDScript.

## When to Use
- Creating 3D product visualization apps
- Building physics simulation tools
- Developing AI-powered desktop applications
- Any desktop app requiring real-time 3D rendering

## Implementation Steps

### 1. Setup Godot 4.6 Project
```bash
# Download Godot 4.6 from https://godotengine.org/download
# Extract to C:\Godot\ (no installation needed)
# Run godot.exe
# Create new project
# Renderer: Forward+ (Vulkan)
# Version Control: Git
```

### 2. Project Structure
```
project/
├── scenes/           # Scene files (.tscn)
├── scripts/          # GDScript files (.gd)
│   ├── core/         # Core systems
│   ├── ai/           # AI agent scripts
│   ├── 3d/           # 3D model handling
│   ├── physics/      # Physics simulation
│   ├── data/         # Database and export
│   └── ui/           # UI components
├── addons/           # GDExtension plugins
├── assets/           # Fonts, icons, shaders, models
├── data/             # Runtime data (goals, artifacts)
└── docs/             # Documentation
```

### 3. Core GDScript Patterns

#### A. Main App Controller
```gdscript
extends Node

signal app_ready
signal goal_submitted(goal: Dictionary)
signal idea_generated(idea: Dictionary)

var current_goal: Dictionary = {}
var is_processing: bool = false

func _ready() -> void:
    _initialize_systems()
    app_ready.emit()

func submit_goal(goal_text: String) -> void:
    current_goal = {
        "id": UUID.generate(),
        "text": goal_text,
        "status": "processing",
        "created_at": Time.get_datetime_string_from_system()
    }
    goal_submitted.emit(current_goal)
    is_processing = true
    await _run_idea_loop()
```

#### B. HTTP API Client
```gdscript
extends Node

const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

var http_request: HTTPRequest

func _ready() -> void:
    http_request = HTTPRequest.new()
    add_child(http_request)
    http_request.request_completed.connect(_on_request_completed)

func complete(prompt: String, model: String = "mistralai/mistral-7b-instruct:free") -> Dictionary:
    var headers = [
        "Authorization: Bearer " + api_key,
        "Content-Type: application/json"
    ]
    var body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    http_request.request(API_ENDPOINT, headers, HTTPClient.METHOD_POST, JSON.stringify(body))
    return await request_completed
```

#### C. GLB Model Loader
```gdscript
func load_glb(path: String) -> Node3D:
    var gltf = GLTFDocument.new()
    var state = GLTFState.new()
    var error = gltf.append_from_file(path, state)
    if error != OK:
        return null
    return gltf.generate_scene(state)
```

#### D. Physics Simulation
```gdscript
func run_simulation(model_path: String, duration: float = 10.0) -> Dictionary:
    var scene = _create_physics_scene(model_path)
    get_tree().root.add_child(scene)
    
    var time = 0.0
    while time < duration:
        await get_tree().create_timer(1.0/60.0).timeout
        time += 1.0/60.0
    
    var results = _analyze_results(scene)
    scene.queue_free()
    return results
```

## Best Practices

### Performance
- Use `await` for async operations (HTTP, timers)
- Pool nodes and reuse scenes
- Use `call_deferred()` for heavy operations
- Profile with Godot's built-in profiler

### GDScript Conventions
- Use signals for communication
- Use `@onready` for node references
- Use `@export` for editor-configurable properties
- Keep functions small and focused

### 3D Rendering
- Use Forward+ renderer for Vulkan
- Use LOD for complex models
- Use instancing for repeated objects
- Optimize shaders for target hardware

### Physics
- Use Jolt Physics (default in Godot 4.6)
- Set proper collision layers
- Use RigidBody3D for dynamic objects
- Use StaticBody3D for static objects

## Common Pitfalls
- Don't block main thread with heavy computation
- Don't forget to free nodes when done
- Don't use `_process()` when `_physics_process()` is needed
- Don't hardcode paths — use `user://` for runtime data

## Resources
- Godot 4.6 Documentation: https://docs.godotengine.org
- GDScript Reference: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/
- Jolt Physics: https://docs.godotengine.org/en/4.6/tutorials/physics/jolt_physics.html
- OpenRouter API: https://openrouter.ai/docs
- godot-sqlite: https://github.com/2shady4u/godot-sqlite

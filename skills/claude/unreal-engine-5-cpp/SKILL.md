---
name: unreal-engine-5-cpp
description: Unreal Engine 5 C++ desktop application development for 3D visualization, physics simulation, and holographic rendering
version: 1.0.0
---

# Unreal Engine 5 C++ Desktop App Development

## Purpose
Build high-performance desktop applications with photorealistic 3D graphics and real-time physics simulation using UE5 and C++.

## When to Use
- Creating 3D product visualization apps
- Building physics simulation tools
- Developing holographic/interactive 3D interfaces
- Any desktop app requiring real-time 3D rendering

## Implementation Steps

### 1. Setup UE5 Project
```bash
# Install Unreal Engine 5.4+ via Epic Games Launcher
# Create new C++ project (NOT Blueprint)
# Select "Blank" template
# Enable plugins: Chaos Physics, Niagara, Media Framework
```

### 2. Project Structure
```
Source/
├── NexusCore/           # Core engine module
│   ├── NexusCore.h
│   └── NexusCore.cpp
├── NexusApp/            # Main application module
│   ├── NexusApp.h
│   └── NexusApp.cpp
├── Actors/              # 3D objects
│   ├── ProductActor.h
│   ├── HologramActor.h
│   └── PhysicsActor.h
├── Components/          # Reusable components
│   ├── HologramComponent.h
│   ├── PhysicsComponent.h
│   └── VoiceComponent.h
├── Systems/             # Game systems
│   ├── ProductSystem.h
│   ├── PhysicsSystem.h
│   └── HologramSystem.h
└── UI/                  # UMG/Slate UI
    ├── NexusHUD.h
    └── ProductPanel.h
```

### 3. Core C++ Classes

#### A. Main Game Mode
```cpp
// NexusGameMode.h
UCLASS()
class ANexusGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    ANexusGameMode();
    virtual void StartPlay() override;
    
    UPROPERTY(EditDefaultsOnly)
    TSubclassOf<AProductActor> ProductBlueprint;
    
    UFUNCTION(BlueprintCallable)
    void SpawnProduct(FProductData Data);
};
```

#### B. Product Actor
```cpp
// ProductActor.h
UCLASS()
class AProductActor : public AActor
{
    GENERATED_BODY()
public:
    AProductActor();
    
    UPROPERTY(VisibleAnywhere)
    UStaticMeshComponent* MeshComponent;
    
    UPROPERTY(VisibleAnywhere)
    UHologramComponent* HologramComponent;
    
    UPROPERTY(VisibleAnywhere)
    UPhysicsComponent* PhysicsComponent;
    
    UFUNCTION(BlueprintCallable)
    void SetProductData(FProductData Data);
    
    UFUNCTION(BlueprintCallable)
    void EnableHologram(bool bEnable);
    
    UFUNCTION(BlueprintCallable)
    void EnablePhysics(bool bEnable);
};
```

#### C. Hologram Component
```cpp
// HologramComponent.h
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class UHologramComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    UHologramComponent();
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float HologramIntensity = 1.0f;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FLinearColor HologramColor = FLinearColor(0, 0.5f, 1.0f, 0.8f);
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float ScanlineSpeed = 1.0f;
    
    UFUNCTION(BlueprintCallable)
    void ActivateHologram();
    
    UFUNCTION(BlueprintCallable)
    void DeactivateHologram();
    
    UFUNCTION(BlueprintCallable)
    void SetColor(FLinearColor NewColor);
    
    void UpdateHologram(float DeltaTime);
    
private:
    UPROPERTY()
    UMaterialInstanceDynamic* HologramMaterial;
    
    bool bIsActive = false;
};
```

### 4. Physics Integration
```cpp
// PhysicsComponent.h
UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class UPhysicsComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bSimulatePhysics = true;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Mass = 1.0f;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Friction = 0.5f;
    
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Restitution = 0.3f;
    
    UFUNCTION(BlueprintCallable)
    void ApplyForce(FVector Force);
    
    UFUNCTION(BlueprintCallable)
    void ApplyTorque(FVector Torque);
    
    UFUNCTION(BlueprintCallable)
    FVector GetVelocity() const;
};
```

### 5. Hologram Material (Shader)
```hlsl
// Hologram.usf
#include "/Engine/Public/Platform.ush"

float4 HologramColor;
float HologramIntensity;
float ScanlineSpeed;
float Time;

float4 HologramVS(float4 Position : POSITION) : SV_POSITION
{
    return TransformObjectToHClip(Position.xyz);
}

float4 HologramPS(float4 Position : SV_POSITION) : SV_TARGET
{
    float2 UV = GetUV0();
    
    // Scanline effect
    float Scanline = sin(UV.y * 100.0 + Time * ScanlineSpeed) * 0.5 + 0.5;
    
    // Glow effect
    float Glow = 1.0 - UV.y;
    Glow = pow(Glow, 2.0);
    
    // Final color
    float4 Color = HologramColor;
    Color.a *= (Scanline * 0.3 + 0.7) * Glow * HologramIntensity;
    
    return Color;
}
```

### 6. Build Configuration
```ini
# DefaultEngine.ini
[/Script/Engine.Engine]
+ActiveGameNameRedirects=(OldGameName="TP_Blank",NewGameName="/Script/NexusApp")
+ActiveGameNameRedirects=(OldGameName="/Script/TP_Blank",NewGameName="/Script/NexusApp")

[/Script/Engine.RendererSettings]
r.GenerateMeshDistanceFields=True
r.DynamicGlobalIlluminationMethod=1
r.ReflectionMethod=1
r.Shadow.Virtual.Enable=1
r.DefaultFeature.AntiAliasing=2

[ConsoleVariables]
r.Nanite=1
r.Lumen.Reflections=1
r.Lumen.GlobalIllumination=1
```

## Best Practices

### Performance
- Use Nanite for high-poly meshes
- Enable Lumen for global illumination
- Use Virtual Shadow Maps
- Pool actors and components
- Use async loading for assets

### C++ Conventions
- Use UPROPERTY() for Blueprint exposure
- Use UFUNCTION(BlueprintCallable) for Blueprint functions
- Use DECLARE_DYNAMIC_MULTICAST_DELEGATE for events
- Keep game thread free from heavy operations

### Physics
- Use Chaos Physics (default in UE5)
- Set proper collision channels
- Use physical materials for friction/restitution
- Enable sub-stepping for accurate simulation

## Common Pitfalls
- Don't block game thread with loading
- Don't forget to clean up dynamic materials
- Don't use Tick() when possible (use timers)
- Don't override default physics settings without reason

## Resources
- UE5 Documentation: https://docs.unrealengine.com
- Chaos Physics: https://docs.unrealengine.com/5.0/en-US/physics-and-collision-in-unreal-engine/
- Niagara VFX: https://docs.unrealengine.com/5.0/en-US/niagara-vfx-system-in-unreal-engine/

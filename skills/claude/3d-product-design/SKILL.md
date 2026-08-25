---
name: 3d-product-design
description: 3D product design and simulation with CAD integration, physics testing, and manufacturing preparation
version: 1.0.0
---

# 3D Product Design & Simulation

## Purpose
Design, simulate, and prepare physical products for manufacturing using industry-standard tools and techniques.

## When to Use
- Creating 3D models of physical products
- Testing product physics (stress, thermal, motion)
- Preparing products for manufacturing
- Generating holographic product visualizations

## Implementation Steps

### 1. Product Data Structure
```typescript
// types/product.ts
interface Product {
  id: string;
  name: string;
  type: 'tablet' | 'car' | 'furniture' | 'device' | 'custom';
  dimensions: {
    width: number;
    height: number;
    depth: number;
    unit: 'mm' | 'cm' | 'm';
  };
  materials: Material[];
  components: ProductComponent[];
  physics: PhysicsProperties;
  manufacturing: ManufacturingInfo;
}

interface Material {
  id: string;
  name: string;
  type: 'metal' | 'plastic' | 'glass' | 'rubber' | 'composite';
  density: number;
  youngsModulus: number;
  poissonsRatio: number;
  thermalConductivity: number;
  color: string;
  texture?: string;
}

interface PhysicsProperties {
  mass: number;
  centerOfMass: [number, number, number];
  momentOfInertia: [number, number, number];
  friction: number;
  restitution: number;
  dragCoefficient: number;
}

interface ProductComponent {
  id: string;
  name: string;
  mesh: string;
  material: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

### 2. CAD Integration (Fusion 360 API)
```typescript
// services/fusion360.ts
class Fusion360Service {
  private apiEndpoint = 'https://api.fusion360.io/v1';
  
  async createProduct(product: Product): Promise<string> {
    // Convert product data to Fusion 360 format
    const fusionData = this.convertToFusionFormat(product);
    
    // Create new design
    const design = await this.api.createDesign(fusionData.name);
    
    // Add components
    for (const component of product.components) {
      await this.createComponent(design.id, component);
    }
    
    // Apply materials
    for (const material of product.materials) {
      await this.applyMaterial(design.id, material);
    }
    
    return design.id;
  }
  
  async simulatePhysics(designId: string, tests: PhysicsTest[]): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];
    
    for (const test of tests) {
      const result = await this.api.runSimulation(designId, test);
      results.push(result);
    }
    
    return results;
  }
  
  async exportForManufacturing(designId: string, format: 'stl' | 'step' | 'iges'): Promise<Blob> {
    return await this.api.exportDesign(designId, format);
  }
}
```

### 3. Physics Simulation Engine
```typescript
// services/physics-engine.ts
class PhysicsEngine {
  private scene: THREE.Scene;
  private world: CANNON.World;
  
  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    
    // Initialize Cannon.js physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    
    // Configure solver
    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.0001;
  }
  
  addProduct(product: Product): void {
    // Create Three.js mesh
    const geometry = this.createGeometry(product);
    const material = this.createMaterial(product);
    const mesh = new THREE.Mesh(geometry, material);
    
    // Create Cannon.js body
    const shape = this.createPhysicsShape(product);
    const body = new CANNON.Body({
      mass: product.physics.mass,
      position: new CANNON.Vec3(...product.dimensions),
      material: new CANNON.Material({
        friction: product.physics.friction,
        restitution: product.physics.restitution
      })
    });
    body.addShape(shape);
    
    // Add to scene and world
    this.scene.add(mesh);
    this.world.addBody(body);
    
    // Store references for sync
    this.meshBodyPairs.set(mesh, body);
  }
  
  runSimulation(duration: number): SimulationResult {
    const startTime = performance.now();
    const results: PhysicsData[] = [];
    
    while (performance.now() - startTime < duration * 1000) {
      // Step physics
      this.world.step(1/60);
      
      // Sync meshes with physics bodies
      this.meshBodyPairs.forEach((body, mesh) => {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      });
      
      // Record data
      results.push(this.recordFrame());
    }
    
    return this.analyzeResults(results);
  }
}
```

### 4. Holographic Visualization
```typescript
// components/HolographicProduct.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

interface HolographicProductProps {
  product: Product;
  physicsEnabled: boolean;
  hologramMode: boolean;
}

export function HolographicProduct({ 
  product, 
  physicsEnabled, 
  hologramMode 
}: HolographicProductProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <ProductModel 
        product={product}
        hologram={hologramMode}
      />
      
      {physicsEnabled && (
        <Physics>
          <PhysicsProduct product={product} />
        </Physics>
      )}
      
      <Environment preset="studio" />
      <OrbitControls />
    </Canvas>
  );
}
```

## Best Practices

### Model Optimization
- Use LOD (Level of Detail) for complex models
- Reduce polygon count where possible
- Use normal maps instead of high-poly details
- Compress textures appropriately

### Physics Accuracy
- Use real-world material properties
- Set correct collision margins
- Enable continuous collision detection for fast objects
- Use constraint systems for joints

### Manufacturing Considerations
- Design for manufacturability (DFM)
- Consider tolerances and clearances
- Use standard materials when possible
- Include assembly instructions

## Common Pitfalls
- Don't ignore material properties in simulation
- Don't skip physics validation before manufacturing
- Don't use arbitrary dimensions (use real measurements)
- Don't forget to account for thermal expansion

## Resources
- Fusion 360 API: https://knowledge.autodesk.com/support/fusion-360/learn-explore/caas/CloudHelp/cloudhelp/2022/03/Fusion-360-API-Overview/files/GUID-737FD6FE-59E5-4E48-A0F2-05C6FC2AC2B5-htm.html
- Three.js: https://threejs.org/
- Cannon.js: https://schteppe.github.io/cannon.js/
- Physics Material Properties: https://www.engineeringtoolbox.com/physical-properties-d_508.html

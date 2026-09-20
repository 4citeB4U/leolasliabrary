import sys
import os
import traceback

trace_file = r"d:\Leeway-Ecosystem v2.1.4\leolas-liabrary\tools\blender_trace.txt"
with open(trace_file, "w") as f:
    f.write("Blender stylize script starting...\n")

try:
    import bpy
    import math

    with open(trace_file, "a") as f:
        f.write(f"Blender version: {bpy.app.version_string}\n")

    # Clean scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)

    # Helper material
    def create_clay_material(name, hex_color, roughness=0.88):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Roughness'].default_value = roughness
        r = int(hex_color[1:3], 16) / 255.0
        g = int(hex_color[3:5], 16) / 255.0
        b = int(hex_color[5:7], 16) / 255.0
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)

        out = nodes.new(type='ShaderNodeOutputMaterial')
        links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        return mat

    mat_skin = create_clay_material("ClaySkin", "#8D5524", 0.85)
    mat_hair = create_clay_material("ClayHair", "#1F1512", 0.95)
    mat_blouse = create_clay_material("ClayBlouse", "#F4EDE2", 0.88)
    mat_vest = create_clay_material("ClayVest", "#2C3E50", 0.82)
    mat_turquoise = create_clay_material("ClayTurquoise", "#2BB6A4", 0.5)
    mat_gold = create_clay_material("ClayGold", "#D4AF37", 0.4)

    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, radius=0.38, location=(0, 0, 1.55))
    head = bpy.context.active_object
    head.name = "Leola_Head"
    head.scale = (0.9, 0.95, 1.05)
    head.data.materials.append(mat_skin)

    # Crown Braids
    bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.08, location=(0, 0, 1.72))
    hair_crown = bpy.context.active_object
    hair_crown.name = "Leola_CrownBraid"
    hair_crown.rotation_euler = (math.radians(15), 0, 0)
    hair_crown.data.materials.append(mat_hair)

    # Back bun
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=18, radius=0.25, location=(0, -0.25, 1.62))
    bun = bpy.context.active_object
    bun.name = "Leola_HairBun"
    bun.scale = (1.1, 0.8, 0.9)
    bun.data.materials.append(mat_hair)

    # Nose
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.06, location=(0, 0.36, 1.53))
    nose = bpy.context.active_object
    nose.name = "Leola_Nose"
    nose.scale = (0.8, 1.2, 0.7)
    nose.data.materials.append(mat_skin)

    # Earrings
    for side, sign in [("L", -1), ("R", 1)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.045, location=(sign * 0.37, 0, 1.42))
        earring = bpy.context.active_object
        earring.name = f"Earring_{side}"
        earring.data.materials.append(mat_turquoise)

        bpy.ops.mesh.primitive_cube_add(size=0.035, location=(sign * 0.37, 0, 1.34))
        bead = bpy.context.active_object
        bead.name = f"Earring_Cube_{side}"
        bead.data.materials.append(mat_gold)

    # Gold Necklace
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.015, location=(0, 0.05, 1.28))
    necklace = bpy.context.active_object
    necklace.name = "GoldNecklace"
    necklace.rotation_euler = (math.radians(20), 0, 0)
    necklace.data.materials.append(mat_gold)

    # Blouse & Vest
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.55, location=(0, 0, 1.0))
    blouse = bpy.context.active_object
    blouse.name = "Leola_Blouse"
    blouse.scale = (1.1, 0.75, 0.9)
    blouse.data.materials.append(mat_blouse)

    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.45, depth=0.55, location=(0, 0, 0.88))
    vest = bpy.context.active_object
    vest.name = "Leola_Vest"
    vest.scale = (1.05, 0.75, 1.0)
    vest.data.materials.append(mat_vest)

    out_dir = r"d:\Leeway-Ecosystem v2.1.4\leolas-liabrary\assets\models"
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, "leola_blender_stylized.glb")

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=False
    )

    with open(trace_file, "a") as f:
        f.write(f"GLB exported successfully: {glb_path}\nFile size: {os.path.getsize(glb_path)} bytes\n")

except Exception as e:
    with open(trace_file, "a") as f:
        f.write(f"ERROR: {str(e)}\n{traceback.format_exc()}\n")

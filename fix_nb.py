import json

paths = [
    r'C:\R drive\Sem-5\ML\MLProject\backend\Week_5.ipynb',
    r'C:\R drive\Sem-5\ML\MLProject\Week_5.ipynb'
]

for path in paths:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            nb = json.load(f)
        
        replaced = False
        for cell in nb['cells']:
            if cell['cell_type'] == 'code':
                for i, line in enumerate(cell['source']):
                    if "algorithm='SAMME'" in line:
                        cell['source'][i] = line.replace(", algorithm='SAMME'", "")
                        replaced = True
        
        if replaced:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(nb, f, indent=1)
            print(f"Fixed {path}")
    except Exception as e:
        print(f"Could not process {path}: {e}")

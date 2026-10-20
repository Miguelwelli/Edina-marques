import os
import zipfile

def create_project_zip():
    output_zip = 'public/projeto-whatsapp-edna-marques.zip'
    exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', 'auth_info', '__pycache__'}
    exclude_files = {'projeto-whatsapp-edna-marques.zip'}

    os.makedirs('public', exist_ok=True)

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if f in exclude_files:
                    continue
                filepath = os.path.join(root, f)
                arcname = os.path.relpath(filepath, '.')
                zipf.write(filepath, arcname)

    print(f"ZIP gerado com sucesso em {output_zip} ({os.path.getsize(output_zip)} bytes)")

if __name__ == '__main__':
    create_project_zip()

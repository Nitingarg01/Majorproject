"""
Switch to Local MongoDB (No Internet Required)
Run this if MongoDB Atlas keeps failing
"""

import os
from pathlib import Path

def setup_local_mongodb():
    """Configure .env to use local MongoDB"""
    
    print("=" * 60)
    print("🔧 Setting up Local MongoDB")
    print("=" * 60)
    
    env_path = Path(__file__).parent / '.env'
    
    # Read current .env
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update MongoDB URL
    new_lines = []
    for line in lines:
        if line.startswith('MONGO_URL='):
            new_lines.append('MONGO_URL=mongodb://localhost:27017/interview_db\n')
            print("✅ Updated MONGO_URL to local MongoDB")
        elif line.startswith('DB_NAME='):
            new_lines.append('DB_NAME=interview_db\n')
            print("✅ Updated DB_NAME to interview_db")
        elif line.startswith('MONGODB_URI='):
            new_lines.append('MONGODB_URI=mongodb://localhost:27017/interview_db\n')
            print("✅ Updated MONGODB_URI to local MongoDB")
        else:
            new_lines.append(line)
    
    # Write back
    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    print("\n📝 .env file updated!")
    print("\n📦 Next Steps:")
    print("\n1. Install MongoDB Community Edition:")
    print("   Download from: https://www.mongodb.com/try/download/community")
    print("   Or use Chocolatey: choco install mongodb")
    print("\n2. Start MongoDB:")
    print("   mongod --dbpath C:\\data\\db")
    print("\n3. Run your server:")
    print("   python server.py")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    setup_local_mongodb()

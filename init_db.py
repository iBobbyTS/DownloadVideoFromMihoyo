import os
import sqlite3


if os.path.exists('database.db'):
    if input('This will delete the existing database. Are you sure? (y/n) ') != 'y':
        exit(1)
    os.remove('database.db')
conn = sqlite3.connect('database.db')
print("Opened database successfully")
conn.execute('''
CREATE TABLE DATA
(
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    GAME TEXT NOT NULL,
    TITLE TEXT NOT NULL,
    CONTENT_ID TEXT NOT NULL,
    ARTWORK TEXT,
    VIDEO TEXT,
    TIMESTAMP INTEGER NOT NULL
);
''')
print("Table created successfully")
conn.close()
with open('last_update.txt', 'w') as f:
    f.write('0')

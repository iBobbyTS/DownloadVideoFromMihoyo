import json
import os.path
import time
import math
import datetime
import signal
import sqlite3
from threading import Thread
import requests
import schedule
from flask import Flask, request, jsonify, send_from_directory, send_file

app = Flask(__name__)
# CORS(app, origins=["content-static.mihoyo.com"])  # Enable CORS for all domains on all routes
conn = sqlite3.connect('database.db', check_same_thread=False)

if os.path.exists('last_update.txt'):
    with open('last_update.txt', 'r') as f:
        last_update = int(f.read())
else:
    last_update = 0
updating = False
break_if_nothing_to_insert = False


def signal_handler(sig, frame):
    conn_for_scheduler.commit()
    conn_for_scheduler.close()
    print('Received Ctrl-C, exiting...')
    exit(1)


def run_scheduler():
    global conn_for_scheduler
    conn_for_scheduler = sqlite3.connect('database.db', check_same_thread=False)
    try:
        while True:
            if time.time() - last_update > 86400:
                schedule.run_all()
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        conn_for_scheduler.close()


def get_until_success(url, interval=30, headers=None):
    while True:
        try:
            response = requests.get(url, headers=headers)
            return response
        except requests.exceptions.RequestException:
            time.sleep(interval)


def get_gi_and_store_in_sql():
    print('get_gi_and_store_in_sql')
    global conn_for_scheduler
    response = get_until_success('https://api-takumi-static.mihoyo.com/content_v2_user/app/16471662a82d418a/getContentList?iAppId=43&iChanId=719&iPageSize=1&iPage=1&sLangKey=zh-cn')
    data = response.json()
    total = math.ceil(data['data']['iTotal']/100)
    page_size = 100
    data_already_in_sql = conn_for_scheduler.execute('SELECT CONTENT_ID FROM DATA WHERE GAME="GI";').fetchall()
    data_already_in_sql = [int(item[0]) for item in data_already_in_sql]
    for i in range(1, total+1):
        url = f'https://api-takumi-static.mihoyo.com/content_v2_user/app/16471662a82d418a/getContentList?iAppId=43&iChanId=719&iPageSize={page_size}&iPage={i}&sLangKey=zh-cn'
        response = get_until_success(url)
        print(f'Page {i}/{total}')
        time.sleep(5)
        data = response.json()
        if data['retcode'] != 0:
            print('Failed to get data')
            return
        data = data['data']['list']
        record_count = 0
        for item in data:
            contentId = item['iInfoId']
            title = item['sTitle']
            if contentId in data_already_in_sql:
                print('skipping ' + title)
                continue
            record_count += 1
            dtCreateTime = item['dtCreateTime']
            dtCreateTime = datetime.datetime.strptime(dtCreateTime, '%Y-%m-%d %H:%M:%S')
            timestamp = int(dtCreateTime.timestamp())
            print(title)
            title = title.replace("'", "''")
            try:
                artwork = item['sExt']
                artwork = json.loads(artwork)['720_1'][0]['url']
            except (KeyError, IndexError):
                artwork = ''
            url = f'https://ys.mihoyo.com/main/news/detail/{contentId}'
            response = get_until_success(url)
            time.sleep(1)
            text = response.text.encode('utf-8').decode('unicode-escape').replace('&nbsp;', ' ')
            if '<video' in text:
                url = text[text.index('<video '):].split('\n')[0]
                url = url[url.index(' src="') + 6:]
                video = url[:url.index('">')]
                if '" ' in video:
                    video = video[:video.index('" ')]
                print(video)
            else:
                video = ''
            statement = f'''INSERT INTO DATA (GAME, TITLE, CONTENT_ID, ARTWORK, VIDEO, TIMESTAMP) VALUES ("GI", \'{title}\', {contentId}, "{artwork}", "{video}", {timestamp});'''
            try:
                conn_for_scheduler.execute(statement)
            except sqlite3.OperationalError as e:
                print(e)
                print(statement)
                return
        conn_for_scheduler.commit()
        if not record_count and break_if_nothing_to_insert:
            break


def update_everything():
    print('update_everything')
    global updating, last_update
    print(updating)
    if updating:
        print('stop')
        return
    updating = True
    print('Updating...')
    get_gi_and_store_in_sql()
    print('Updated')
    updating = False
    last_update = int(time.time())
    with open('last_update.txt', 'w') as f:
        f.write(str(int(last_update)))


@app.route('/', methods=['GET'])
def get_index():
    return send_file('index.html')


@app.route('/js/<path:path>', methods=['GET'])
def get_js(path):
    return send_from_directory('js', path)


@app.route('/img/<path:path>', methods=['GET'])
def get_img(path):
    return send_from_directory('img', path)


@app.route('/resource/<path:path>', methods=['GET'])
def get_resource(path):
    return send_from_directory('resource', path)


@app.route('/get_last_update_api', methods=['GET'])
def get_last_update_api():
    return jsonify({'last_update': last_update})


@app.route('/get_status_api', methods=['GET'])
def get_status_api():
    return jsonify({'updating': updating})


@app.route('/search_gi_api', methods=['GET'])
def search_gi_api():
    keyword = request.args.get('keyword')
    fetch = conn.execute(f'SELECT TITLE, CONTENT_ID, ARTWORK, VIDEO, TIMESTAMP FROM DATA WHERE GAME="GI" AND TITLE LIKE "%{keyword}%" ORDER BY TIMESTAMP DESC;').fetchall()
    fetch = [{'title': item[0], 'content_id': item[1], 'artwork': item[2], 'video': item[3], 'timestamp': item[4]} for item in fetch]
    return jsonify({'result': fetch})


@app.route('/update_api', methods=['GET'])
def update_api():
    update_everything()
    return jsonify({'status': 'updating'})


if __name__ == '__main__':
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        print('WERKZEUG_RUN_MAIN')
        # Save last_update on Ctrl-C
        signal.signal(signal.SIGINT, signal_handler)
        # Schedule
        schedule.every().day.at("14:00").do(update_everything)
        # Create and start the scheduler thread
        scheduler_thread = Thread(target=run_scheduler)
        scheduler_thread.start()
    # Flask
    app.run(debug=False, host='0.0.0.0', port=1203)

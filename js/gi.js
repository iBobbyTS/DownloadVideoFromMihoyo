backend_url = '';
hide_non_video = false;

function detectOS() {
    var platform = navigator.platform.toLowerCase();
    var userAgent = navigator.userAgent.toLowerCase();

    if (platform.startsWith('win') || userAgent.indexOf('windows') !== -1) {
        return 'Windows';
    } else if (platform.startsWith('mac') || userAgent.indexOf('mac') !== -1) {
        return 'Mac';
    } else {
        return 'Other';
    }
}

var os = detectOS();
let download_instructions = '按住Alt点击下载';
if (os === 'Mac') {
    download_instructions = '按住Option点击下载';
}

function zfill(number, width) {
    const numberAsString = number.toString();
    const zerosNeeded = Math.max(width - numberAsString.length, 0);
    const zeros = new Array(zerosNeeded + 1).join('0');
    return zeros + numberAsString;
}

function toggleImage(index) {
    const container = document.getElementById(`image-container-${index}`);
    const button = container.querySelector('.toggle-button');
    if (container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        container.classList.add('expanded');
        container.style.maxHeight = 'none';
        button.textContent = '折叠';
    } else {
        container.classList.remove('expanded');
        container.classList.add('collapsed');
        container.style.maxHeight = container.querySelector('img').width/1.5+'px';
        button.textContent = '展开';
    }
}
document.addEventListener('DOMContentLoaded', function() {
    // 生成对应系统的下载提示
    document.getElementById('download-instruction').innerText = download_instructions;
    // 搜索框回车搜索
    document.getElementById('keyword-input').addEventListener('keydown', function(event) {
        // Check if the key pressed is the Enter key
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            search();
        }
    });
    // 填入数据库上次更新时间
    fetch(backend_url+'/get_last_update_api', {cache: "no-store"})
        .then(response => response.json())
        .then(data => {
            let time = new Date(data['last_update']*1000);
            document.getElementById('last-update').innerText += `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${zfill(time.getHours(), 2)}:${zfill(time.getMinutes(), 2)}`;
        });
    fetch(backend_url+'/get_status_api', {cache: "no-store"})
        .then(response => response.json())
        .then(data => {
            if (data['updating']){
                document.getElementById('updating').innerHTML = `正在更新<img src="${backend_url}/img/loading.svg" alt="" height="32px"/>`;
            } else {
                document.getElementById('updating').innerHTML = `已完成更新<img src="${backend_url}/img/done.svg" alt="" height="32px"/>`;
            }
        });
});

function img_onload(tag) {
    tag.parentElement.parentElement.style.maxHeight=tag.width/1.5+'px';
    if (tag.height < tag.width/1.5) {
        tag.parentElement.nextElementSibling.style.display = 'none';
    }
}

function img_onerror(tag){
    tag.parentElement.nextElementSibling.style.display = 'none';
}


function search() {
    let keyword = document.getElementById('keyword-input').value;
    if (keyword === '') {
        if (!confirm('搜索关键字为空，是否搜索全部内容？')) {
            return;
        }
    }
    let url = backend_url+'/search_gi_api?keyword=' + keyword;
    fetch(url, {cache: "no-store"})
        .then(response => response.json())
        .then(data => {
            let innerHTML = '';
            data = data['result'];
            let index = 0;
            for (let i of data) {
                let title = i['title'].replace('《原神》', '');
                let video = i['video'];
                let game = i['game'];
                let video_td;
                if (video === '') {
                    video_td = '<td width="20%">无视频</td>';
                } else {
                    video_td = `<td width="20%"><a href="${i['video']}" download="${title}.mp4" target="_blank">下载</a><br>或复制链接链接: <span>${video}</span></td>`;
                }
                let date = new Date(i['timestamp']*1000);
                const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
                // innerHTML += `<tr class="${video === '' ? 'non-video' : 'video'}"><td>${title}</td><td width="20%"><a href="https://ys.mihoyo.com/main/news/detail/${i['content_id']}" target="_blank"><img width="100%" src="${i['artwork']}" alt="${title}"/></a></td>${video_td}<td>${formattedDate}</td></tr>`;
                innerHTML += `<tr class="${video === '' ? 'non-video' : 'video'}"><td>${title}</td><td width="20%"><div class="image-container collapsed" id="image-container-${index}"><a href="${game === 'GI' ? 'https://ys.mihoyo.com/main/news/detail' : 'https://sr.mihoyo.com/news'}/${i['content_id']}" target="_blank"><img width="100%" src="${i['artwork']}" alt="${title}" onerror="img_onerror(this)" onload="img_onload(this)"/></a><button class="toggle-button" onclick="toggleImage(${index})">展开</button></div></td>${video_td}<td>${formattedDate}</td></tr>`;
                index += 1;
            }
            if (data.length === 0) {
                alert('未找到相关内容')
            } else {
                document.getElementById('result').innerHTML = innerHTML;
            }
        });
}
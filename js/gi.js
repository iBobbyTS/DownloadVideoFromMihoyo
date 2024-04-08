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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('download-instruction').innerText = download_instructions;
    document.getElementById('keyword-input').addEventListener('keydown', function(event) {
        // Check if the key pressed is the Enter key
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            search();
        }
    });

});

function search() {
    let keyword = document.getElementById('keyword-input').value;
    if (keyword === '') {
        if (!confirm('搜索关键字为空，是否搜索全部内容？')) {
            return;
        }
    }
    let url = '/search_gi_api?keyword=' + keyword;
    fetch(url, {cache: "no-store"})
        .then(response => response.json())
        .then(data => {
            let innerHTML = '';
            data = data['result'];
            for (let i of data) {
                let title = i['title'].replace('《原神》', '');
                let video = i['video'];
                let video_td;
                if (video === '') {
                    video_td = '<td width="20%">无视频</td>';
                } else {
                    video_td = `<td width="20%"><a href="${i['video']}" download="${title}.mp4" target="_blank">下载</a><br>或复制链接链接: <span>${video}</span></td>`;
                }
                innerHTML += `<tr class="${video === '' ? 'video' : 'photo'}"><td>${title}</td><td width="20%"><a href="https://ys.mihoyo.com/main/news/detail/${i['content_id']}" target="_blank"><img width="100%" src="${i['artwork']}" alt="${title}"/></a></td>${video_td}</tr>`;
            }
            if (data.length === 0) {
                alert('未找到相关内容')
            } else {
                document.getElementById('result').innerHTML = innerHTML;
            }
        });
}
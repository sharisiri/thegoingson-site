const got = require('got');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const async = require('async');
const sharp = require('sharp');

const client_cred = 'MmQwYTE2OGEzODcyNDY4MGIwYjg4NGQzYjg3ZDQ4NDk6MTE5NzQyZTliNTc2NDk5OWE3MWQxZDRjNjQ5M2RlYWY=';
var plObjects = [];
(async() => {
        try {
            var accessToken = await got.post('https://accounts.spotify.com/api/token', {form:true, body : {grant_type :"client_credentials"}, headers: {Authorization : 'Basic ' + client_cred} });
            accessToken = JSON.parse(accessToken.body).access_token;
            console.log(accessToken);
            var playlists = await got('https://api.spotify.com/v1/users/ombudsmannen/playlists?limit=50', { json: true, headers: {Authorization : 'Bearer ' + accessToken} });
            var playlistItems = playlists.body.items;
            for (x in playlistItems) {
                if (playlistItems[x].name.startsWith('the goings on #')){
                    console.log(playlistItems[x].href);
                    var pl = await got(playlistItems[x].href + '?market=SE', { json: true, headers: {Authorization : 'Bearer ' + accessToken} });
                    var plObj = {};
                    plObj.name = pl.body.name;
                    plObj.number = parseInt(plObj.name.substr(plObj.name.indexOf('#')+1));
                    plObj.spotifyLink = pl.body.external_urls.spotify;
                    plObj.image = 'img/' + plObj.name.replace(/\s/g, '-').replace('#','') + '.jpg';
                    // await sharp(plObj.image,{progressive: true}).resize(960, 960,{ fit: 'inside', withoutEnlargement: true }).toFile('site/' + plObj.image);
                    plObj.curator = '';(new RegExp(/curated by ([\s\S]*?)\./g)).exec(pl.body.description)[1];
                    plObj.tracks = [];
                    plObj.duration = 0;
                    // var noPreviewTracks = {}
                    var tracks = pl.body.tracks.items;
                    var ytTracks = '';
                    for (y in tracks) {
                        var track = {};
                        _tr_num = parseInt(y) + 1;
                        track.number = _tr_num;//(_tr_num < 10) ? '0' + _tr_num : '' + _tr_num;
                        track.artist = tracks[y].track.artists.map(function(elem){return elem.name;}).join(", ");
                        track.title = tracks[y].track.name;
                        ytTracks += track.artist + ' - ' + track.title + '\n';
                        track.duration = msToTime(tracks[y].track.duration_ms);
                        plObj.duration += tracks[y].track.duration_ms;
                        // track.preview = tracks[y].track.preview_url;
                        // if (!track.preview) {
                        //      // console.log(track.artist + '-' + track.title + ' ' + track.preview + "\n\n");
                        //     noPreviewTracks[tracks[y].track.id] = y;
                        }
                        track.spotifyLink = tracks[y].track.external_urls.spotify;
                        track.youtubeLink = 'https://www.youtube.com/results?search_query=' + track.artist.replace(/\s/g,'+').replace('/\,/g','') + '+' + track.title.replace(/\s/g,'+');
                        plObj.tracks.push(track);
                    }

                    // noPrevKeys = Object.keys(noPreviewTracks);
                    // noPrevTrksData = await got('https://api.spotify.com/v1/tracks/?market=US&ids=' + noPrevKeys.join(','), { json: true, headers: {Authorization : 'Bearer ' + accessToken} });
                    // for (z in noPrevTrksData.body.tracks){
                    //     if (noPrevTrksData.body.tracks[z].preview_url){
                    //         // console.log(noPrevTrksData.body.tracks[z].name)

                    //         plObj.tracks[noPreviewTracks[noPrevKeys[z]]].preview = noPrevTrksData.body.tracks[z].preview_url;
                    //     }
                    // }
                    plObj.duration = msToHourMin(plObj.duration);

                    // var ytFile = await got.post('http://roll.io/controller/controller.php?action=textbox&song_number=0', {form:true, body : {list : ytTracks}});
                    // var ytId = await got.post('http://roll.io/controller/controller.php?action=playlist', {form:true, headers: {Cookie : 'filename=' + JSON.parse(ytFile.body).filename.replace('\/',"%2F").replace('/', "%2F") + ';'}});

                    // plObj.youtube = (new RegExp(/hashtag=\"([\s\S]*?)\"/)).exec(ytId.body)[1];

                    plObjects.push(plObj);

                }

            }
            // console.log(plObjects);
            plObjects.sort(compare);
            var _html = nunjucks.render('template.html', {playlists : plObjects});
            var filePath = 'site/index.html';
            fs.writeFile(filePath, _html, (err) => {
                if (err) throw err;

            });
        } catch(error){
            console.log(error)
        }
})();


function compare(a,b) {
  if (a.number < b.number)
    return 1;
  if (a.number > b.number)
    return -1;
  return 0;
}


function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return ((hours === '00') ? '' : (hours + ":")) + minutes + ":" + seconds;
}

function msToHourMin(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);


    // minutes = (minutes < 10) ? "0" + minutes : minutes;


    return ((hours == 0) ? '' : (hours + " h ")) + minutes + " min";
}

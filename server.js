/*

TODO Hardcoded account name
TODO find real limit for number of stories

*/


const http = require('http');
const tracker = require('pivotaltracker');
const cookie = require('cookie');

function getToken() {
    var token = process.env['PT_TOKEN'] || process.argv[2];
    if (typeof token === 'string' && /^[0-9a-f]+$/.test(token) && token.length === 32) {
        return token;
    } else {
        console.log('found:', token);
        throw 'Must pass token as $PT_TOKEN or on command line'
    }
}

const state = {
    client: new tracker.Client(getToken()),
    projects: null,
    currentProject: null
};
state.client.projects.all((error, projects) => {
    if (error) {
        console.log(error);
    } else {
        state.projects = projects;
        for (var p of projects) {
            console.log(`${p.id} ${p.name}`);
        }
    }
});

function loadCurrentProject(projectID) {
    state.currentProject = null;
    for (var project of state.projects || []) {
        if (project.id === projectID) {
            state.currentProject = project;
            break;
        }
    }
    if (!state.currentProject) {
        console.log('Project not found');
        return;
    }

    if (state.currentProject.stories) return;

    state.loading = true;
    state.client.project(projectID).stories.all({
        filter: '-state:accepted owned_by:TL',
        limit: 5000,
        fields: 'current_state,name,owned_by'
    }, (error, stories) => {
        state.loading = false;
        if (error) {
            console.log(error);
        } else {
            if (!state.currentProject) return; // someone else cleared this
            state.currentProject.stories = stories;
            for (var p of stories) {
                console.log(`${p.id} ${p.currentState} ${p.name}`);
            }
            console.log(stories[0]);
        }
    });
}

function handleRequest(req, res) {
    var cookies = cookie.parse(req.headers.cookie || '');
    if (cookies.project) {
        loadCurrentProject(parseInt(cookies.project, 10));
    }

    if (/^\/[0-9]+$/.test(req.url)) {
        var id = parseInt(req.url.substring(1), 10);
        console.log(id);
        try {
            loadCurrentProject(id);

            // Redirect, setting cookie
            res.writeHead(302, { 'set-cookie': 'project=' + id, 'location': '/' });
            res.end();
            return;
        } catch (e) {
            console.log(e);
        }
    }

    if (/^\/all$/.test(req.url)) {
        // Redirect, setting cookie
        res.writeHead(302, { 'set-cookie': 'project=all', 'location': '/' });
        res.end();
        return;
    }

    var headers = { 'Content-Type': 'text/html' };
    var html = `
      <style>

      a { display: block}
      .story {
        border: 1px solid #F00; /* odd color, shows unhandled states */
        margin: 5px;
        padding: 5px;
        background: #444;
      }
      body { background: #221; color: #FEE; padding: 0; margin: 0;}
      .started { border-color: #AAF; background: #446; }
      .unstarted { border-color: #AAA; background: #444; }
      .unscheduled { border-color: #666; background: #222; color: #666; }
      .finished { border-color: #AFA; background: #464; }

      nav {
        background: #333;
        padding: 5px;
      }
      nav h1 {
        display: inline-block;
        font-size: 16px;
        line-height: 1em;
        margin: 0;
      }
      nav a.project {
        float: right;
        color: #888;
        text-decoration: none;
      }
      </style>
      <script>
      var exampleSocket = new WebSocket("ws://localhost:8000/");
      exampleSocket.onopen = function () {
        console.log('open!');
      }
      exampleSocket.onmessage = function (event) {
        console.log(event.data);
      }
      exampleSocket.onerror = function (event) {
        console.log(event);
      }
      exampleSocket.onclose = function (event) {
        console.log(event);
        setTimeout(function () {
          location.reload();
        }, 1500);
      }
      </script>
      <nav><h1>StoryFlow</h1>   <a class="project" href="/all">${state.currentProject && state.currentProject.name}</a></nav>
    `;
    if (state.currentProject) {
        if (state.loading) {
            html += `<div>loading...</div>`;
            headers['refresh'] = '0.5'
        }
        if (state.currentProject.stories) {
            for (const story of state.currentProject.stories) {
                if (story.currentState != 'accepted') {
                    html += `<div class="story ${story.currentState}">${story.name}</div>`;
                }
            }
        }
    } else {
        for (const project of state.projects) {
            html += `<a href="${project.id}">${project.name}</a>`;
        }
    }

    res.writeHead(200, headers);
    res.end(html);
}


const WebSocket = require('ws');
const server = http.createServer(handleRequest);
const wss = new WebSocket.Server({ server });

// Currently the websocket does nothing except tell the page the
// server is ready to accept connections.
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    ws.send('something');
});

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);
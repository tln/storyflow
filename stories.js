const filestore = require('./filestore');
const tracker = require('pivotaltracker');
const EventEmitter = require('events');

// Wrapper around pivotal
class Stories extends EventEmitter {
    constructor(store) {
        super();
        this.store = store;
    }
    set(attr, val) {
        const obj = this.store.obj;
        obj[attr] = val;
        this.store.obj = obj;
    }
    get token() {
        return this.store.obj.token;
    }
    set token(value) {
        this.set('token', value);
        this.load();
    }
    load() {
        return new Promise((resolve, reject) => {
            if (!this.token) resolve();
            console.log('token:', this.token);
            this.client = new tracker.Client(this.token);
            this.client.projects.all((error, projects) => {
                /* Stuff & things (projects returned in an array) */
                if (error) {
                    console.log(error);
                    resolve(); // resolve the loading, even though the token is broken
                    return;
                }
                this.projects = projects;
                resolve();
            });
        }).then((cli))
    }
    get currentProject() {
        return this.client.project(this.store.obj.currentProject);
    }
    set currentProject(project) {
        if (typeof project !== 'number') {
            project = project.id;
            if (typeof project !== 'number') {
                throw 'Expected a numeric ID or object with an `id` attribute';
            }
        }
        this.set('currentProject', project);
        this.load();
    }
    loadStories() {
        this.stories
    }
}
module.exports = new Stories(filestore);
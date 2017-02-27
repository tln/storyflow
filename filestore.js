const fs = require('fs');
class FileStore {
    constructor(file) {
        this.file = file;
        this.fileMissing = false;
        this.obj = null;
        this.load();
    }
    get obj() {
        if (this.obj || this.fileMissing) {
            return this.obj || {};
        }
        try {
            fs.readFileSync('.pivotal_token');
            this.obj = JSON.parse(data);
        } catch (e) {
            this.fileMissing = true;
        }
        return this.obj || {};
    }
    set obj(value) {
        this.obj = value;
        var data = JSON.stringify(this.obj);
        fs.writeFileSync('.pivotal_token', data);
        this.fileMissing = false;
    }
}
module.exports = new FileStore('.pivotaltracker');
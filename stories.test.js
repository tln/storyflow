var mockSTORE = { obj: {} };

function store(obj) {
    return () => mockSTORE.obj = obj;
}

function storeAndLoad(obj) {
    return () => {
        mockSTORE.obj = obj;
        return stories.load();
    }
}

jest.mock('./filestore', () => mockSTORE);
const stories = require('./stories');

describe('with no store', () => {
    beforeEach(store({}));
    test('token is undefined', () => {
        expect(stories.token).toBe(undefined);
    });
    test('setting token saves data', () => {
        stories.token = 'foo';
        expect(mockSTORE.obj).toEqual({ token: 'foo' });
    });
});

describe('with a token', function() {
    beforeEach(storeAndLoad({ token: 'faeb81ca267949977c21d430c526a2cc' }));
    test('gets projects', () => {
        console.log(stories.projects[0]);
        expect(stories.projects).toBeDefined();
    });
    test('setting currentProject gets stories', () => {
        stories.currentProject =
            console.log(stories.stories);
        expect(stories.stories).toBeDefined();
    });
});
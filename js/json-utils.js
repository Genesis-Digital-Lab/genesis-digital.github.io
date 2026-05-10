// JSON Utility Functions

// Simple YAML dumper (recursive)
function jsonToYaml(obj, indentLevel = 0) {
    const indent = '  '.repeat(indentLevel);
    let yaml = '';

    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                yaml += `${indent}-\n${jsonToYaml(item, indentLevel + 1).replace(/^/gm, '  ')}`;
            } else {
                yaml += `${indent}- ${jsonToYaml(item, indentLevel + 1)}\n`;
            }
        });
    } else {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        keys.forEach(key => {
            const value = obj[key];
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    yaml += `${indent}${key}:\n${jsonToYaml(value, indentLevel + 1)}`;
                } else {
                    yaml += `${indent}${key}:\n${jsonToYaml(value, indentLevel + 1)}`;
                }
            } else {
                yaml += `${indent}${key}: ${value}\n`;
            }
        });
    }
    return yaml;
}

// JSON to Python Dict Code
function jsonToPython(obj) {
    // JSON is very similar to Python dict syntax, just need to handle true/false/null
    let pythonCode = JSON.stringify(obj, null, 4);
    pythonCode = pythonCode.replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/null/g, 'None');
    return `data = ${pythonCode}`;
}

// JSON to Javascript Object Code
function jsonToJs(obj) {
    return `const data = ${JSON.stringify(obj, null, 4)};`;
}

// JSON Stats
function getJsonStats(jsonStr) {
    return {
        lines: jsonStr.split('\n').length,
        chars: jsonStr.length,
        size: new Blob([jsonStr]).size
    };
}

// JSON Path Finder (Simple recursive search)
function findPath(obj, keyToFind, currentPath = '') {
    let paths = [];
    if (typeof obj !== 'object' || obj === null) return [];

    for (let key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        if (key === keyToFind) {
            paths.push(newPath);
        }
        if (typeof obj[key] === 'object') {
            paths = paths.concat(findPath(obj[key], keyToFind, newPath));
        }
    }
    return paths;
}

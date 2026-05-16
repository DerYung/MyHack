const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Regex to match imports like: import { X } from "package@1.2.3" or from "@radix-ui/react-accordion@1.1.2"
    const newContent = content.replace(/from\s+["']((?:@[^\/]+\/)?[^@"']+)@[^"']+["']/g, 'from "$1"');
    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
    }
});

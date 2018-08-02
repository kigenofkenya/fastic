#!/usr/bin/env node

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const clipboardy = require('clipboardy');

const types = getTypes();
const port = process.argv[2] || 5050;
const root = process.argv[3] || '.';

http.createServer((req, res) => {
	const {method} = req;
	const {url} = req;
	let requestPath = decodeURI(url.replace(/^\/+/, '').replace(/\?.*$/, ''));
	const filePath = path.resolve(root, requestPath);
	const type = types[path.extname(filePath)] || 'application/octet-stream';

	fs.stat(filePath, (err, stat) => {
		if (stat && stat.isDirectory()) {
			fs.readFile(filePath + '/index.html', (err, content) => {
				if (err) {
					requestPath = (requestPath + '/').replace(/\/+$/, '/');
					listDirectory(res, filePath, requestPath);
					logResponse(`${chalk.green('fastic')} ${chalk.dim('›')} `, `${chalk.cyan(method)}`, url, `${chalk.yellow(200)}`);
				} else {
					sendFile(res, 'text/html', content);
					logResponse(`${chalk.green('fastic')} ${chalk.dim('›')} `, `${chalk.cyan(method)}`, url, `${chalk.yellow(200)}`);
				}
			});
		} else {
			fs.readFile(filePath, (err, content) => {
				if (err) {
					logResponse(`${chalk.green('fastic')} ${chalk.dim('›')} `, `${chalk.cyan(method)}`, url, `${chalk.red(404)}`);
				} else {
					sendFile(res, type, content);
					logResponse(`${chalk.green('fastic')} ${chalk.dim('›')} `, `${chalk.cyan(method)}`, url, `${chalk.yellow(200)}`);
				}
			});
		}
	});
}).listen(port, () => {
	console.log(`${chalk.green('fastic')} ${chalk.dim('›')} Running on http://localhost:${port} ${chalk.dim('[copied to clipboard]')}`);
	console.log('\n=> Press Ctrl + C to stop');
	clipboardy.write(`http://localhost:${port}`);
});

function sendFile(res, type, content) {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');

	res.setHeader('Content-Type', type);

	res.end(content);
}

function listDirectory(res, dir, requestPath) {
	res.setHeader('Content-Type', 'text/html');
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');

	fs.readdir(dir, (err, fileNames) => {
		let numRemaining = fileNames.length;
		const files = [];
		const dirs = [];

		fileNames.forEach(name => {
			fs.stat(path.join(dir, name), (err, stat) => {
				if (stat) {
					if (stat.isDirectory()) {
						dirs.push(name + '/');
					} else {
						files.push(name);
					}
				}

				if (!--numRemaining) {
					sendDirListing(res, files, dirs, requestPath);
				}
			});
		});
	});
}

function sendDirListing(res, files, dirs, requestPath) {
	requestPath = ('/' + requestPath).replace(/\/+/g, '/');

	let content = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin-left: 25px">';
	content += '<h2>Listing files for ' + requestPath + '</h2>';
	content += '<ul>';

	content += dirs.map(dir => {
		return '<li><a href="' + requestPath + dir + '">' + dir + '</a></li>';
	}).join('');
	content += files.map(file => {
		return '<li><a href="' + requestPath + file + '">' + file + '</a></li>';
	}).join('');
	content += '</ul>';
	content += '<footer>Powered by <a href="https://github.com/xxczaki/fastic">fastic</a> 🚀</footer>';
	content += '</body></html>';
	res.end(content);
}

function logResponse(method, url, code, type) {
	console.log(`${chalk.cyan(method)}`, url, `${chalk.yellow(type)}`, code);
}

function getTypes() {
	return {
		'.avi': 'video/avi',
		'.bmp': 'image/bmp',
		'.css': 'text/css',
		'.gif': 'image/gif',
		'.svg': 'image/svg+xml',
		'.htm': 'text/html',
		'.html': 'text/html',
		'.ico': 'image/x-icon',
		'.jpeg': 'image/jpeg',
		'.jpg': 'image/jpeg',
		'.js': 'text/javascript',
		'.json': 'application/json',
		'.mov': 'video/quicktime',
		'.mp3': 'audio/mpeg3',
		'.mpa': 'audio/mpeg',
		'.mpeg': 'video/mpeg',
		'.mpg': 'video/mpeg',
		'.oga': 'audio/ogg',
		'.ogg': 'application/ogg',
		'.ogv': 'video/ogg',
		'.pdf': 'application/pdf',
		'.png': 'image/png',
		'.tif': 'image/tiff',
		'.tiff': 'image/tiff',
		'.txt': 'text/plain',
		'.wav': 'audio/wav',
		'.xml': 'text/xml'
	};
}
const app = angular.module('engineeringHacksApp', []);

app.controller('MainController', function ($scope, $window) {
    // Load tools data
    $scope.tools = toolsData;

    // Categories for filtering
    $scope.categories = ['All', ...new Set(toolsData.map(tool => tool.category))];
    $scope.selectedCategory = 'All';

    // Filter function
    $scope.filterTools = function (category) {
        $scope.selectedCategory = category;
    };

    // Check if tool should be shown
    $scope.isToolVisible = function (tool) {
        return $scope.selectedCategory === 'All' || tool.category === $scope.selectedCategory;
    };

    // Navigate to tool
    $scope.navigateTo = function (tool) {
        if (tool.url && tool.url !== '#') {
            $window.location.href = tool.url;
        }
    };

    $scope.goTo = function (tool) {
        if (tool.url && tool.url !== '#') {
            $window.location.href = tool.url;
        }
    };

    // RTL Detection
    $scope.isRtl = false;

    function checkRtl() {
        const rtlLocales = ['ar', 'he', 'fa', 'ur'];
        const userLocale = navigator.language || navigator.userLanguage;
        const langCode = userLocale ? userLocale.split('-')[0] : 'en';

        if (rtlLocales.includes(langCode)) {
            $scope.isRtl = true;
            document.body.classList.add('rtl-mode');
            document.dir = 'rtl';
        }
    }

    checkRtl();

    $scope.toggleRtl = function () {
        $scope.isRtl = !$scope.isRtl;
        if ($scope.isRtl) {
            document.body.classList.add('rtl-mode');
            document.dir = 'rtl';
        } else {
            document.body.classList.remove('rtl-mode');
            document.dir = 'ltr';
        }
    };
});

app.controller('JsonController', function ($scope, $timeout) {
    $scope.inputJson = '';
    $scope.viewMode = 'tree'; // tree, text, table
    $scope.jsonData = null;
    $scope.error = null;
    $scope.copiedPath = null;
    $scope.stats = null;
    $scope.pathQuery = '';
    $scope.foundPaths = [];

    // Helper to parse JSON safely
    function parseInput() {
        try {
            if (!$scope.inputJson.trim()) {
                $scope.jsonData = null;
                $scope.stats = null;
                return false;
            }
            $scope.jsonData = JSON.parse($scope.inputJson);
            $scope.error = null;
            $scope.updateStats();
            return true;
        } catch (e) {
            $scope.error = "Invalid JSON: " + e.message;
            $scope.stats = null;
            return false;
        }
    }

    $scope.updateStats = function () {
        if ($scope.inputJson) {
            $scope.stats = getJsonStats($scope.inputJson);
        } else {
            $scope.stats = null;
        }
    };

    $scope.formatJson = function () {
        if (parseInput()) {
            $scope.viewMode = 'tree';
            $scope.inputJson = JSON.stringify($scope.jsonData, null, 4);
            $scope.updateStats();
        }
    };

    $scope.minifyJson = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.inputJson = JSON.stringify($scope.jsonData);
            $scope.outputString = $scope.inputJson;
            $scope.updateStats();
        }
    };

    $scope.clearInput = function () {
        $scope.inputJson = '';
        $scope.jsonData = null;
        $scope.error = null;
        $scope.stats = null;
        $scope.viewMode = 'tree';
        $scope.outputString = '';
    };

    $scope.fixJson = function () {
        try {
            // Simple fix for common issues (keys without quotes, single quotes)
            let fixed = $scope.inputJson
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix keys
                .replace(/'/g, '"'); // Replace single quotes

            $scope.jsonData = JSON.parse(fixed);
            $scope.inputJson = JSON.stringify($scope.jsonData, null, 4);
            $scope.viewMode = 'tree';
            $scope.error = null;
            $scope.updateStats();
        } catch (e) {
            $scope.error = "Could not auto-fix JSON. Please check syntax manually.";
        }
    };

    $scope.jsonToTable = function () {
        if (parseInput()) {
            if (Array.isArray($scope.jsonData) && $scope.jsonData.length > 0) {
                $scope.viewMode = 'table';
                $scope.tableHeaders = Object.keys($scope.jsonData[0]);
                $scope.tableData = $scope.jsonData;
            } else {
                $scope.error = "For Table view, JSON must be an array of objects.";
            }
        }
    };

    $scope.jsonToXml = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.outputString = json2xml($scope.jsonData);
        }
    };

    $scope.jsonToCsv = function () {
        if (parseInput()) {
            if (Array.isArray($scope.jsonData) && $scope.jsonData.length > 0) {
                $scope.viewMode = 'text';
                const headers = Object.keys($scope.jsonData[0]);
                const csvRows = [];
                csvRows.push(headers.join(','));

                for (const row of $scope.jsonData) {
                    const values = headers.map(header => {
                        const escaped = ('' + row[header]).replace(/"/g, '\\"');
                        return `"${escaped}"`;
                    });
                    csvRows.push(values.join(','));
                }
                $scope.outputString = csvRows.join('\n');
            } else {
                $scope.error = "For CSV conversion, JSON must be an array of objects.";
            }
        }
    };

    $scope.jsonToYaml = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.outputString = jsonToYaml($scope.jsonData);
        }
    };

    $scope.jsonToMarkdown = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.outputString = '```json\n' + JSON.stringify($scope.jsonData, null, 4) + '\n```';
        }
    };

    $scope.jsonToPython = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.outputString = jsonToPython($scope.jsonData);
        }
    };

    $scope.jsonToJs = function () {
        if (parseInput()) {
            $scope.viewMode = 'text';
            $scope.outputString = jsonToJs($scope.jsonData);
        }
    };

    $scope.loadSample = function () {
        const sample = {
            "name": "EngineeringHacks",
            "tools": ["JSON", "Base64", "Regex"],
            "active": true,
            "meta": {
                "version": 1.0,
                "author": "Dev"
            }
        };
        $scope.inputJson = JSON.stringify(sample, null, 4);
        parseInput();
    };

    $scope.downloadJson = function () {
        if (parseInput()) {
            const blob = new Blob([$scope.inputJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    $scope.findPath = function () {
        if (parseInput() && $scope.pathQuery) {
            $scope.foundPaths = findPath($scope.jsonData, $scope.pathQuery);
        } else {
            $scope.foundPaths = [];
        }
    };

    // Simple JSON to XML converter
    function json2xml(o, tab) {
        var toXml = function (v, name, ind) {
            var xml = "";
            if (v instanceof Array) {
                for (var i = 0, n = v.length; i < n; i++)
                    xml += ind + toXml(v[i], name, ind + "\t") + "\n";
            } else if (typeof (v) == "object") {
                var hasChild = false;
                xml += ind + "<" + name;
                for (var m in v) {
                    if (m.charAt(0) == "@")
                        xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                    else
                        hasChild = true;
                }
                xml += hasChild ? ">" : "/>";
                if (hasChild) {
                    for (var m in v) {
                        if (m == "#text")
                            xml += v[m];
                        else if (m == "#cdata")
                            xml += "<![CDATA[" + v[m] + "]]>";
                        else if (m.charAt(0) != "@")
                            xml += toXml(v[m], m, ind + "\t");
                    }
                    xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</" + name + ">";
                }
            } else {
                xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
            }
            return xml;
        }, xml = "";
        for (var m in o)
            xml += toXml(o[m], m, "");
        return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
    }

    $scope.copyOutput = function () {
        let textToCopy = '';

        if ($scope.viewMode === 'tree' || $scope.viewMode === 'table') {
            // For tree/table, copy the formatted JSON
            if ($scope.jsonData) {
                textToCopy = JSON.stringify($scope.jsonData, null, 4);
            }
        } else if ($scope.viewMode === 'text') {
            // For XML/CSV, copy the output string
            textToCopy = $scope.outputString;
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                $scope.copiedOutput = true;
                $timeout(() => $scope.copiedOutput = false, 2000);
            });
        }
    };

    // Event emitted from directive
    $scope.$on('path-copied', function (event, path) {
        $scope.copiedPath = path;
        $timeout(() => $scope.copiedPath = null, 2000);
    });
});

app.controller('Base64Controller', function ($scope) {
    $scope.inputText = '';
    $scope.outputText = '';
    $scope.mode = 'encode'; // encode, decode

    $scope.setMode = function (mode) {
        $scope.mode = mode;
        $scope.autoConvert();
    };

    $scope.autoConvert = function () {
        try {
            if ($scope.mode === 'encode') {
                $scope.outputText = btoa($scope.inputText);
            } else {
                $scope.outputText = atob($scope.inputText);
            }
        } catch (e) {
            $scope.outputText = "Invalid Base64 input";
        }
    };

    $scope.copyOutput = function () {
        navigator.clipboard.writeText($scope.outputText);
    };
});



app.controller('LoremController', function ($scope) {
    $scope.numParagraphs = 3;
    $scope.paragraphs = [];

    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    $scope.generateLorem = function () {
        $scope.paragraphs = [];
        for (let i = 0; i < $scope.numParagraphs; i++) {
            // Randomize slightly by slicing
            let start = Math.floor(Math.random() * 50);
            let p = loremText.substring(start) + " " + loremText.substring(0, start);
            $scope.paragraphs.push(p);
        }
    };

    $scope.copyLorem = function () {
        navigator.clipboard.writeText($scope.paragraphs.join('\n\n'));
    };

    // Init
    $scope.generateLorem();
});



app.controller('RegexController', function ($scope) {
    $scope.regexPattern = '';
    $scope.regexFlags = 'g';
    $scope.testString = 'The quick brown fox jumps over the lazy dog. Contact us at support@engineeringhacks.com or visit https://engineeringhacks.com';
    $scope.matches = [];
    $scope.error = null;
    $scope.snippetLang = 'js';

    $scope.regexSamples = [
        { name: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
        { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'g' },
        { name: 'Phone Number', pattern: '\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}', flags: 'g' },
        { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
        { name: 'IPv4 Address', pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)', flags: 'g' }
    ];

    $scope.loadSample = function (sample) {
        $scope.regexPattern = sample.pattern;
        $scope.regexFlags = sample.flags;
        $scope.testRegex();
    };

    $scope.testRegex = function () {
        if (!$scope.regexPattern) {
            $scope.matches = [];
            $scope.error = null;
            return;
        }

        try {
            const regex = new RegExp($scope.regexPattern, $scope.regexFlags);
            const str = $scope.testString;
            let match;
            $scope.matches = [];

            if ($scope.regexFlags.includes('g')) {
                while ((match = regex.exec(str)) !== null) {
                    $scope.matches.push(match[0]);
                }
            } else {
                match = regex.exec(str);
                if (match) {
                    $scope.matches.push(match[0]);
                }
            }
            $scope.error = null;
        } catch (e) {
            $scope.error = e.message;
            $scope.matches = [];
        }
    };

    $scope.generateSnippet = function () {
        const pattern = $scope.regexPattern || '[a-z]+';
        const flags = $scope.regexFlags || 'g';

        switch ($scope.snippetLang) {
            case 'js':
                return `const regex = /${pattern}/${flags};\nconst str = \`${$scope.testString}\`;\nlet m;\n\nwhile ((m = regex.exec(str)) !== null) {\n    console.log(m[0]);\n}`;
            case 'python':
                return `import re\n\npattern = r'${pattern}'\ntext = "${$scope.testString}"\n\nmatches = re.findall(pattern, text)\nfor match in matches:\n    print(match)`;
            case 'php':
                return `$pattern = '/${pattern}/${flags}';\n$text = "${$scope.testString}";\n\npreg_match_all($pattern, $text, $matches);\nprint_r($matches[0]);`;
            case 'go':
                return `package main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tpattern := \`${pattern}\`\n\ttext := \`${$scope.testString}\`\n\n\tre := regexp.MustCompile(pattern)\n\tmatches := re.FindAllString(text, -1)\n\n\tfor _, match := range matches {\n\t\tfmt.Println(match)\n\t}\n}`;
            default:
                return '';
        }
    };
});

app.controller('QrController', function ($scope, $timeout) {
    $scope.qrText = 'https://engineeringhacks.com';
    $scope.qrColor = '#000000';
    $scope.qrBg = '#ffffff';
    let qrcode = null;

    $scope.generateQr = function () {
        const container = document.getElementById('qrcode');
        container.innerHTML = '';

        qrcode = new QRCode(container, {
            text: $scope.qrText,
            width: 256,
            height: 256,
            colorDark: $scope.qrColor,
            colorLight: $scope.qrBg,
            correctLevel: QRCode.CorrectLevel.H
        });
    };

    // Init after view loads
    $timeout($scope.generateQr, 100);
});



app.controller('ApiController', function ($scope, $http, $timeout) {
    $scope.method = 'GET';
    $scope.url = '';
    $scope.requestBody = '{\n  "key": "value"\n}';
    $scope.loading = false;
    $scope.response = null;
    $scope.responseTime = 0;

    $scope.params = [{ key: '', value: '' }];
    $scope.headers = [{ key: 'Content-Type', value: 'application/json' }];
    $scope.auth = { type: 'none', token: '', username: '', password: '', key: '', value: '' };
    $scope.bodyType = 'json';
    $scope.formData = [{ key: '', value: '' }];

    $scope.history = JSON.parse(localStorage.getItem('api_history') || '[]');
    $scope.curlInput = '';

    // History management
    $scope.saveToHistory = function () {
        const item = {
            method: $scope.method,
            url: $scope.url,
            params: angular.copy($scope.params),
            headers: angular.copy($scope.headers),
            auth: angular.copy($scope.auth),
            bodyType: $scope.bodyType,
            requestBody: $scope.requestBody,
            formData: angular.copy($scope.formData),
            timestamp: new Date().getTime()
        };
        $scope.history.unshift(item);
        if ($scope.history.length > 50) $scope.history.pop();
        localStorage.setItem('api_history', JSON.stringify($scope.history));
    };

    $scope.loadHistory = function (item) {
        $scope.method = item.method;
        $scope.url = item.url;
        $scope.params = angular.copy(item.params);
        $scope.headers = angular.copy(item.headers);
        $scope.auth = angular.copy(item.auth);
        $scope.bodyType = item.bodyType;
        $scope.requestBody = item.requestBody;
        $scope.formData = angular.copy(item.formData);
    };

    $scope.clearHistory = function () {
        $scope.history = [];
        localStorage.removeItem('api_history');
    };

    $scope.getMethodColor = function (method) {
        const colors = { 'GET': 'success', 'POST': 'primary', 'PUT': 'warning', 'PATCH': 'info', 'DELETE': 'danger' };
        return colors[method] || 'secondary';
    };

    // Params & Headers management
    $scope.addParam = function () { $scope.params.push({ key: '', value: '' }); };
    $scope.removeParam = function (index) { $scope.params.splice(index, 1); $scope.updateUrlFromParams(); };

    $scope.addHeader = function () { $scope.headers.push({ key: '', value: '' }); };
    $scope.removeHeader = function (index) { $scope.headers.splice(index, 1); };

    $scope.addFormData = function () { $scope.formData.push({ key: '', value: '' }); };
    $scope.removeFormData = function (index) { $scope.formData.splice(index, 1); };

    $scope.updateUrlFromParams = function () {
        if (!$scope.url) return;
        let baseUrl = $scope.url.split('?')[0];
        let query = $scope.params
            .filter(p => p.key)
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&');
        $scope.url = query ? `${baseUrl}?${query}` : baseUrl;
    };

    $scope.sendRequest = function () {
        if (!$scope.url) return;

        $scope.loading = true;
        $scope.response = null;
        const startTime = new Date().getTime();

        const config = {
            method: $scope.method,
            url: $scope.url,
            headers: {}
        };

        // Add custom headers
        $scope.headers.forEach(h => {
            if (h.key) config.headers[h.key] = h.value;
        });

        // Add Auth
        if ($scope.auth.type === 'bearer' && $scope.auth.token) {
            config.headers['Authorization'] = `Bearer ${$scope.auth.token}`;
        } else if ($scope.auth.type === 'basic' && $scope.auth.username) {
            config.headers['Authorization'] = `Basic ${btoa($scope.auth.username + ':' + $scope.auth.password)}`;
        } else if ($scope.auth.type === 'apikey' && $scope.auth.key) {
            config.headers[$scope.auth.key] = $scope.auth.value;
        }

        // Add Body
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes($scope.method)) {
            if ($scope.bodyType === 'json') {
                try {
                    config.data = JSON.parse($scope.requestBody);
                } catch (e) {
                    config.data = $scope.requestBody;
                }
            } else if ($scope.bodyType === 'form-data') {
                const fd = new FormData();
                $scope.formData.forEach(f => { if (f.key) fd.append(f.key, f.value); });
                config.data = fd;
                config.headers['Content-Type'] = undefined; // Let browser set it
            } else if ($scope.bodyType === 'raw') {
                config.data = $scope.requestBody;
            }
        }

        $http(config).then(function (response) {
            $scope.response = response;
            $scope.responseTime = new Date().getTime() - startTime;
            $scope.loading = false;
            $scope.saveToHistory();
        }, function (error) {
            $scope.response = error;
            $scope.responseTime = new Date().getTime() - startTime;
            $scope.loading = false;
            $scope.saveToHistory();
        });
    };

    // cURL Import
    $scope.showCurlModal = function () {
        const modal = new bootstrap.Modal(document.getElementById('curlModal'));
        modal.show();
    };

    $scope.importCurl = function () {
        if (!$scope.curlInput) return;

        try {
            const curl = $scope.curlInput;

            // Extract URL
            const urlMatch = curl.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'"]+)['"]?/);
            if (urlMatch) $scope.url = urlMatch[1];

            // Extract Method
            const methodMatch = curl.match(/-X\s+(\w+)/);
            if (methodMatch) $scope.method = methodMatch[1].toUpperCase();
            else if (curl.includes('--data') || curl.includes('-d ')) $scope.method = 'POST';
            else $scope.method = 'GET';

            // Extract Headers
            const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
            $scope.headers = [];
            for (const match of headerMatches) {
                const parts = match[1].split(':');
                if (parts.length >= 2) {
                    $scope.headers.push({ key: parts[0].trim(), value: parts.slice(1).join(':').trim() });
                }
            }

            // Extract Data
            const dataMatch = curl.match(/(?:--data|-d)\s+['"]([^'"]+)['"]/);
            if (dataMatch) {
                $scope.requestBody = dataMatch[1];
                $scope.bodyType = 'json';
            }

            bootstrap.Modal.getInstance(document.getElementById('curlModal')).hide();
            $scope.curlInput = '';
        } catch (e) {
            alert('Failed to parse cURL command');
        }
    };

    // Export/Import Collections
    $scope.exportCollections = function () {
        const data = JSON.stringify($scope.history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'engineering-hacks-collection.json';
        a.click();
    };

    $scope.importCollections = function (input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            $scope.$apply(() => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        $scope.history = imported.concat($scope.history).slice(0, 50);
                        localStorage.setItem('api_history', JSON.stringify($scope.history));
                    }
                } catch (err) {
                    alert('Invalid collection file');
                }
            });
        };
        reader.readAsText(file);
    };
});


app.controller('AudioController', function ($scope) {
    // Headphone Tester
    $scope.frequency = 440;
    $scope.volume = 50;
    $scope.waveType = 'sine';
    $scope.isPlaying = false;

    let audioCtx;
    let oscillator;
    let gainNode;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    $scope.updateFrequency = function () {
        if (oscillator) {
            oscillator.frequency.setValueAtTime($scope.frequency, audioCtx.currentTime);
        }
    };

    $scope.updateVolume = function () {
        if (gainNode) {
            gainNode.gain.setValueAtTime($scope.volume / 100, audioCtx.currentTime);
        }
    };

    $scope.setWaveType = function (type) {
        $scope.waveType = type;
        if (oscillator) {
            oscillator.type = type;
        }
    };

    $scope.toggleTone = function () {
        initAudio();
        if ($scope.isPlaying) {
            oscillator.stop();
            oscillator.disconnect();
            $scope.isPlaying = false;
        } else {
            oscillator = audioCtx.createOscillator();
            gainNode = audioCtx.createGain();

            oscillator.type = $scope.waveType;
            oscillator.frequency.setValueAtTime($scope.frequency, audioCtx.currentTime);
            gainNode.gain.setValueAtTime($scope.volume / 100, audioCtx.currentTime);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            $scope.isPlaying = true;
        }
    };

    $scope.playLeft = function () {
        playPan(-1);
    };

    $scope.playRight = function () {
        playPan(1);
    };

    function playPan(panVal) {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const pan = audioCtx.createStereoPanner();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        pan.pan.setValueAtTime(panVal, audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(pan);
        pan.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1); // Play for 1 second
    }

    // Mic Tester
    $scope.micActive = false;
    $scope.micError = null;
    let micStream;
    let analyser;
    let dataArray;
    let canvasCtx;
    let animationId;

    $scope.startMic = function () {
        initAudio();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                $scope.$apply(() => {
                    $scope.micActive = true;
                    $scope.micError = null;
                });
                micStream = stream;
                const source = audioCtx.createMediaStreamSource(stream);
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);

                const canvas = document.getElementById('micVisualizer');
                canvasCtx = canvas.getContext('2d');
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                drawMic();
            })
            .catch(function (err) {
                $scope.$apply(() => {
                    $scope.micError = "Could not access microphone: " + err.message;
                });
            });
    };

    $scope.stopMic = function () {
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
        }
        cancelAnimationFrame(animationId);
        $scope.micActive = false;
    };

    function drawMic() {
        animationId = requestAnimationFrame(drawMic);
        analyser.getByteTimeDomainData(dataArray);

        const canvas = document.getElementById('micVisualizer');
        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 255, 0)';
        canvasCtx.beginPath();

        const sliceWidth = width * 1.0 / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }
});

app.controller('CameraController', function ($scope) {
    $scope.cameras = [];
    $scope.selectedCamera = null;
    $scope.isStreamActive = false;
    $scope.error = null;
    $scope.snapshots = [];

    let videoStream;

    // Get available cameras
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            $scope.$apply(() => {
                $scope.cameras = devices.filter(d => d.kind === 'videoinput');
                if ($scope.cameras.length > 0) {
                    $scope.selectedCamera = $scope.cameras[0].deviceId;
                }
            });
        });

    $scope.startCamera = function () {
        const constraints = {
            video: $scope.selectedCamera ? { deviceId: { exact: $scope.selectedCamera } } : true
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const video = document.getElementById('videoElement');
                video.srcObject = stream;
                videoStream = stream;
                $scope.$apply(() => {
                    $scope.isStreamActive = true;
                    $scope.error = null;
                });
            })
            .catch(err => {
                $scope.$apply(() => {
                    $scope.error = "Could not access camera: " + err.message;
                });
            });
    };

    $scope.stopCamera = function () {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            const video = document.getElementById('videoElement');
            video.srcObject = null;
            $scope.isStreamActive = false;
        }
    };

    $scope.switchCamera = function () {
        if ($scope.isStreamActive) {
            $scope.stopCamera();
            $scope.startCamera();
        }
    };

    $scope.takeSnapshot = function () {
        const video = document.getElementById('videoElement');
        const canvas = document.getElementById('canvasElement');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/png');
        $scope.snapshots.unshift(dataUrl);
    };

    $scope.removeSnapshot = function (index) {
        $scope.snapshots.splice(index, 1);
    };
});

app.controller('InputController', function ($scope) {
    // Keyboard
    $scope.lastKey = { code: '-', key: '-', type: '-' };
    $scope.pressedKeys = {};
    $scope.commonKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Space', 'Enter', 'Shift', 'Ctrl', 'Alt'];

    document.addEventListener('keydown', function (e) {
        $scope.$apply(() => {
            $scope.lastKey = { code: e.code, key: e.key, type: 'keydown' };

            let keyDisplay = e.key.length === 1 ? e.key.toUpperCase() : e.key;
            if (e.code === 'Space') keyDisplay = 'Space';

            $scope.pressedKeys[keyDisplay] = true;
            // Handle modifiers specifically if needed
            if (e.shiftKey) $scope.pressedKeys['Shift'] = true;
            if (e.ctrlKey) $scope.pressedKeys['Ctrl'] = true;
            if (e.altKey) $scope.pressedKeys['Alt'] = true;
        });
    });

    document.addEventListener('keyup', function (e) {
        $scope.$apply(() => {
            $scope.lastKey = { code: e.code, key: e.key, type: 'keyup' };

            let keyDisplay = e.key.length === 1 ? e.key.toUpperCase() : e.key;
            if (e.code === 'Space') keyDisplay = 'Space';

            $scope.pressedKeys[keyDisplay] = false;
            if (!e.shiftKey) $scope.pressedKeys['Shift'] = false;
            if (!e.ctrlKey) $scope.pressedKeys['Ctrl'] = false;
            if (!e.altKey) $scope.pressedKeys['Alt'] = false;
        });
    });

    $scope.resetKeys = function () {
        $scope.pressedKeys = {};
        $scope.lastKey = { code: '-', key: '-', type: '-' };
    };

    // Mouse
    $scope.mouseState = { left: false, middle: false, right: false, scroll: 0, x: 0, y: 0 };
    $scope.clicks = [];

    $scope.onMouseDown = function (e) {
        if (e.button === 0) $scope.mouseState.left = true;
        if (e.button === 1) $scope.mouseState.middle = true;
        if (e.button === 2) $scope.mouseState.right = true;

        addClickMarker(e);
    };

    $scope.onMouseUp = function (e) {
        if (e.button === 0) $scope.mouseState.left = false;
        if (e.button === 1) $scope.mouseState.middle = false;
        if (e.button === 2) $scope.mouseState.right = false;
    };

    $scope.onMouseMove = function (e) {
        $scope.mouseState.x = e.offsetX;
        $scope.mouseState.y = e.offsetY;
    };

    $scope.preventMenu = function (e) {
        e.preventDefault();
    };

    function addClickMarker(e) {
        const colors = ['#007bff', '#28a745', '#dc3545'];
        $scope.clicks.push({
            x: e.offsetX,
            y: e.offsetY,
            color: colors[e.button] || '#000'
        });
        if ($scope.clicks.length > 20) $scope.clicks.shift();
    }
});


app.controller('FlowchartController', function ($scope) {
    $scope.mermaidCode = 'graph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;';

    $scope.renderDiagram = function () {
        const element = document.getElementById('mermaidPreview');
        element.removeAttribute('data-processed');
        element.innerHTML = $scope.mermaidCode;
        mermaid.init(undefined, element);
    };

    $scope.loadExample = function (type) {
        if (type === 'simple') {
            $scope.mermaidCode = 'graph TD;\n    Start-->Process;\n    Process-->End;';
        } else if (type === 'sequence') {
            $scope.mermaidCode = 'sequenceDiagram\n    Alice->>John: Hello John, how are you?\n    John-->>Alice: Great!';
        } else if (type === 'state') {
            $scope.mermaidCode = 'stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]';
        }
        $scope.renderDiagram();
    };

    $scope.downloadSvg = function () {
        const svg = document.querySelector('#mermaidPreview svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'flowchart.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Init
    setTimeout($scope.renderDiagram, 500);
});

app.controller('PlantUmlController', function ($scope, $timeout) {
    $scope.pumlCode = '@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n@enduml';
    $scope.diagramUrl = '';

    let debounceTimer;

    $scope.updateDiagram = function () {
        // Use plantuml-encoder to encode
        // We assume the library is loaded globally as `plantumlEncoder`
        if (window.plantumlEncoder) {
            const encoded = plantumlEncoder.encode($scope.pumlCode);
            $scope.diagramUrl = 'https://www.plantuml.com/plantuml/img/' + encoded;
        }
    };

    $scope.updateDiagramDebounced = function () {
        if (debounceTimer) $timeout.cancel(debounceTimer);
        debounceTimer = $timeout($scope.updateDiagram, 500);
    };

    // Init
    $timeout($scope.updateDiagram, 500);
});

app.controller('BarcodeController', function ($scope, $timeout) {
    $scope.config = {
        text: '123456789',
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true
    };

    $scope.generateBarcode = function () {
        try {
            JsBarcode("#barcode", $scope.config.text, {
                format: $scope.config.format,
                width: $scope.config.width,
                height: $scope.config.height,
                displayValue: $scope.config.displayValue
            });
        } catch (e) {
            console.error("Barcode error", e);
        }
    };

    $scope.downloadBarcode = function () {
        const svg = document.getElementById('barcode');
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'barcode.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Init
    $timeout($scope.generateBarcode, 100);
});

app.controller('ImageController', function ($scope, $timeout) {
    $scope.imageSrc = null;
    $scope.compressedSrc = null;
    $scope.quality = 80;
    $scope.originalSize = '';
    $scope.compressedSize = '';
    $scope.savings = 0;

    let originalFile = null;

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            originalFile = file;
            $scope.originalSize = formatBytes(file.size);

            const reader = new FileReader();
            reader.onload = function (e) {
                $scope.$apply(function () {
                    $scope.imageSrc = e.target.result;
                    $scope.compressImage();
                });
            };
            reader.readAsDataURL(file);
        }
    };

    $scope.compressImage = function () {
        if (!$scope.imageSrc) return;
        $scope.compressedSrc = null; // Show spinner

        $timeout(function () {
            const img = new Image();
            img.src = $scope.imageSrc;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const quality = $scope.quality / 100;
                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                $scope.$apply(function () {
                    $scope.compressedSrc = dataUrl;

                    // Calculate size
                    const head = 'data:image/jpeg;base64,';
                    const size = Math.round((dataUrl.length - head.length) * 3 / 4);
                    $scope.compressedSize = formatBytes(size);

                    const originalBytes = originalFile.size;
                    $scope.savings = Math.round(((originalBytes - size) / originalBytes) * 100);
                });
            };
        }, 300);
    };

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    $scope.downloadImage = function () {
        if (!$scope.compressedSrc) return;
        const link = document.createElement('a');
        link.href = $scope.compressedSrc;
        link.download = 'optimized-image.jpg';
        link.click();
    };

    $scope.reset = function () {
        $scope.imageSrc = null;
        $scope.compressedSrc = null;
        $scope.originalSize = '';
        $scope.compressedSize = '';
        $scope.savings = 0;
        originalFile = null;
        document.getElementById('fileInput').value = '';
    };

    $scope.shareImage = function (platform) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Check out this Image Optimizer tool!');
        let shareUrl = '';

        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
        }

        if (shareUrl) window.open(shareUrl, '_blank');
    };

    $scope.copyShareLink = function () {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copied to clipboard!');
        });
    };
});


app.controller('CircuitController', function ($scope) {
    // Placeholder
});

app.controller('CompilerController', function ($scope) {
    $scope.language = 'javascript';
    $scope.code = '// Write your code here\nconsole.log("Hello World");';
    $scope.output = '';

    $scope.changeLanguage = function () {
        switch ($scope.language) {
            case 'javascript':
                $scope.code = '// Write your code here\nconsole.log("Hello World");';
                break;
            case 'python':
                $scope.code = '# Write your code here\nprint("Hello World")';
                break;
            case 'sql':
                $scope.code = '-- Write your SQL here\nSELECT "Hello World";';
                break;
            case 'c':
                $scope.code = '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}';
                break;
            case 'cpp':
                $scope.code = '#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}';
                break;
            case 'rust':
                $scope.code = 'fn main() {\n    println!("Hello World");\n}';
                break;
        }
    };

    $scope.runCode = function () {
        $scope.output = 'Running...\n';

        if ($scope.language === 'javascript') {
            try {
                // Capture console.log
                let logs = [];
                const originalLog = console.log;
                console.log = function (...args) {
                    logs.push(args.join(' '));
                    originalLog.apply(console, args);
                };

                // Run code
                eval($scope.code);

                // Restore console.log
                console.log = originalLog;

                $scope.output = logs.join('\n');
                if (logs.length === 0) $scope.output = 'Code executed successfully (no output).';
            } catch (e) {
                $scope.output = 'Error: ' + e.message;
            }
        } else {
            // Simulated output for other languages
            setTimeout(() => {
                $scope.$apply(() => {
                    if ($scope.code.includes('print') || $scope.code.includes('console.log') || $scope.code.includes('SELECT') || $scope.code.includes('printf') || $scope.code.includes('cout') || $scope.code.includes('println!')) {
                        $scope.output = 'Hello World\n\n[Program exited with code 0]';
                    } else {
                        $scope.output = '[Program exited with code 0]';
                    }
                });
            }, 500);
        }
    };

    $scope.clearConsole = function () {
        $scope.output = '';
    };

    $scope.getExtension = function () {
        const map = {
            'javascript': 'js',
            'python': 'py',
            'sql': 'sql',
            'c': 'c',
            'cpp': 'cpp',
            'rust': 'rs'
        };
        return map[$scope.language] || 'txt';
    };
});

app.controller('FormatterController', function ($scope) {
    $scope.language = 'html';
    $scope.indentSize = '4';
    $scope.inputCode = '';
    $scope.outputCode = '';

    $scope.formatCode = function () {
        if (!$scope.inputCode) return;

        const opts = {
            indent_size: $scope.indentSize === 'tab' ? 1 : parseInt($scope.indentSize),
            indent_char: $scope.indentSize === 'tab' ? '\t' : ' ',
        };

        if ($scope.language === 'html') {
            $scope.outputCode = html_beautify($scope.inputCode, opts);
        } else if ($scope.language === 'css') {
            $scope.outputCode = css_beautify($scope.inputCode, opts);
        } else if ($scope.language === 'javascript' || $scope.language === 'json') {
            $scope.outputCode = js_beautify($scope.inputCode, opts);
        } else if ($scope.language === 'sql') {
            // Basic SQL formatting (simulated as we don't have a library loaded)
            $scope.outputCode = $scope.inputCode
                .replace(/\s+/g, ' ')
                .replace(/SELECT/gi, '\nSELECT')
                .replace(/FROM/gi, '\nFROM')
                .replace(/WHERE/gi, '\nWHERE')
                .replace(/AND/gi, '\n  AND')
                .replace(/OR/gi, '\n  OR')
                .replace(/ORDER BY/gi, '\nORDER BY')
                .replace(/GROUP BY/gi, '\nGROUP BY')
                .replace(/INSERT INTO/gi, '\nINSERT INTO')
                .replace(/VALUES/gi, '\nVALUES')
                .replace(/UPDATE/gi, '\nUPDATE')
                .replace(/SET/gi, '\nSET')
                .replace(/DELETE FROM/gi, '\nDELETE FROM')
                .trim();
        }
    };

    $scope.clear = function () {
        $scope.inputCode = '';
        $scope.outputCode = '';
    };

    $scope.copyOutput = function () {
        navigator.clipboard.writeText($scope.outputCode);
    };
});

app.controller('ConverterController', function ($scope) {
    $scope.excelData = '';
    $scope.markdownData = '';

    $scope.toMarkdown = function () {
        if (!$scope.excelData) return;

        const rows = $scope.excelData.trim().split('\n');
        if (rows.length === 0) return;

        let md = '';

        // Header
        const headers = rows[0].split('\t');
        md += '| ' + headers.join(' | ') + ' |\n';

        // Separator
        md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

        // Data
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split('\t');
            md += '| ' + cols.join(' | ') + ' |\n';
        }

        $scope.markdownData = md;
    };

    $scope.toExcel = function () {
        if (!$scope.markdownData) return;

        const lines = $scope.markdownData.trim().split('\n');
        // Filter out separator lines (containing ---)
        const dataLines = lines.filter(line => !line.includes('---'));

        let excel = '';

        dataLines.forEach(line => {
            // Remove leading/trailing pipes and split
            let content = line.trim();
            if (content.startsWith('|')) content = content.substring(1);
            if (content.endsWith('|')) content = content.substring(0, content.length - 1);

            const cols = content.split('|').map(c => c.trim());
            excel += cols.join('\t') + '\n';
        });

        $scope.excelData = excel;
    };

    $scope.clear = function () {
        $scope.excelData = '';
        $scope.markdownData = '';
    };

    $scope.pasteExcel = async function () {
        try {
            const text = await navigator.clipboard.readText();
            $scope.$apply(() => {
                $scope.excelData = text;
            });
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    $scope.copyMarkdown = function () {
        navigator.clipboard.writeText($scope.markdownData);
    };
});

app.controller('PdfToImageController', function ($scope, $timeout) {
    $scope.pdfFile = null;
    $scope.pages = [];
    $scope.loading = false;
    $scope.pageCount = 0;

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            $timeout(() => {
                $scope.pdfFile = file;
                $scope.processPdf(file);
            });
        }
    };

    $scope.processPdf = async function (file) {
        $scope.loading = true;
        $scope.pages = [];

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            $scope.pageCount = pdf.numPages;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                $scope.$apply(() => {
                    $scope.pages.push({
                        imgData: canvas.toDataURL('image/jpeg'),
                        pageNum: i
                    });
                });
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF. Please try another file.');
        } finally {
            $scope.$apply(() => {
                $scope.loading = false;
            });
        }
    };

    $scope.downloadPage = function (index) {
        const link = document.createElement('a');
        link.href = $scope.pages[index].imgData;
        link.download = `page-${index + 1}.jpg`;
        link.click();
    };

    $scope.downloadAll = function () {
        const zip = new JSZip();
        $scope.pages.forEach((page, i) => {
            const imgData = page.imgData.split(',')[1];
            zip.file(`page-${i + 1}.jpg`, imgData, { base64: true });
        });

        zip.generateAsync({ type: 'blob' }).then(function (content) {
            saveAs(content, 'pdf-images.zip');
        });
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        $scope.pages = [];
        $scope.pageCount = 0;
        document.getElementById('fileInput').value = '';
    };
});

app.controller('PdfToWordController', function ($scope, $timeout) {
    $scope.pdfFile = null;
    $scope.extractedText = '';
    $scope.loading = false;
    $scope.pageCount = 0;

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            $timeout(() => {
                $scope.pdfFile = file;
                $scope.processPdf(file);
            });
        }
    };

    $scope.processPdf = async function (file) {
        $scope.loading = true;
        $scope.extractedText = '';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            $scope.pageCount = pdf.numPages;

            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
            }

            $scope.$apply(() => {
                $scope.extractedText = fullText;
            });
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF.');
        } finally {
            $scope.$apply(() => {
                $scope.loading = false;
            });
        }
    };

    $scope.downloadDoc = function () {
        const blob = new Blob([$scope.extractedText], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'document.doc';
        link.click();
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        $scope.extractedText = '';
        $scope.pageCount = 0;
        document.getElementById('fileInput').value = '';
    };
});

app.controller('JpgToPdfController', function ($scope, $timeout) {
    $scope.images = [];
    $scope.pageSize = 'a4';
    $scope.orientation = 'p';
    $scope.margin = 10;

    $scope.handleFileSelect = function (element) {
        const files = Array.from(element.files);
        if (files.length > 0) {
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    $timeout(() => {
                        $scope.images.push({
                            name: file.name,
                            data: e.target.result
                        });
                    });
                };
                reader.readAsDataURL(file);
            });
        }
        element.value = ''; // Reset input
    };

    $scope.removeImage = function (index) {
        $scope.images.splice(index, 1);
    };

    $scope.clearAll = function () {
        $scope.images = [];
    };

    $scope.generatePdf = function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: $scope.orientation,
            unit: 'mm',
            format: $scope.pageSize === 'auto' ? 'a4' : $scope.pageSize
        });

        const margin = $scope.margin;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);

        $scope.images.forEach((img, index) => {
            if (index > 0) doc.addPage();

            const imgProps = doc.getImageProperties(img.data);
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;

            // Scale to fit
            const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;

            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            doc.addImage(img.data, 'JPEG', x, y, finalWidth, finalHeight);
        });

        doc.save('images.pdf');
    };
});

app.controller('ImageEditorController', function ($scope, $timeout) {
    let canvas;
    $scope.hasImage = false;
    $scope.mode = 'select';
    $scope.selectedObject = null;
    $scope.canvasBg = '#ffffff';

    $scope.props = {
        fill: '#ff0000',
        stroke: '#000000',
        strokeWidth: 1,
        opacity: 1,
        fontSize: 40,
        fontFamily: 'Arial'
    };

    // Undo/Redo State
    let history = [];
    let historyIndex = -1;
    let isRedoing = false;

    $timeout(() => {
        canvas = new fabric.Canvas('editorCanvas', {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
        });

        canvas.on('selection:created', updateSelection);
        canvas.on('selection:updated', updateSelection);
        canvas.on('selection:cleared', () => {
            $timeout(() => {
                $scope.selectedObject = null;
            });
        });

        canvas.on('object:added', saveHistory);
        canvas.on('object:modified', saveHistory);
        canvas.on('object:removed', saveHistory);

        saveHistory(); // Initial state
    });

    function saveHistory() {
        if (isRedoing) return;
        const json = canvas.toJSON();
        history = history.slice(0, historyIndex + 1);
        history.push(json);
        historyIndex++;
    }

    $scope.undo = function () {
        if (historyIndex > 0) {
            isRedoing = true;
            historyIndex--;
            canvas.loadFromJSON(history[historyIndex], () => {
                canvas.renderAll();
                isRedoing = false;
            });
        }
    };

    $scope.redo = function () {
        if (historyIndex < history.length - 1) {
            isRedoing = true;
            historyIndex++;
            canvas.loadFromJSON(history[historyIndex], () => {
                canvas.renderAll();
                isRedoing = false;
            });
        }
    };

    function updateSelection(e) {
        const obj = e.selected[0];
        $timeout(() => {
            $scope.selectedObject = obj;
            $scope.props.fill = obj.fill;
            $scope.props.stroke = obj.stroke;
            $scope.props.strokeWidth = obj.strokeWidth;
            $scope.props.opacity = obj.opacity;
            if (obj.type === 'i-text') {
                $scope.props.fontSize = obj.fontSize;
                $scope.props.fontFamily = obj.fontFamily;
            }
        });
    }

    $scope.setMode = function (mode) {
        $scope.mode = mode;
        canvas.isDrawingMode = (mode === 'draw');
        if (canvas.isDrawingMode) {
            canvas.freeDrawingBrush.width = parseInt($scope.props.strokeWidth) || 5;
            canvas.freeDrawingBrush.color = $scope.props.stroke;
        }
    };

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fabric.Image.fromURL(e.target.result, (img) => {
                    // Scale image to fit canvas
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                    img.scale(scale);
                    canvas.add(img);
                    canvas.centerObject(img);
                    canvas.renderAll();
                    $timeout(() => { $scope.hasImage = true; });
                });
            };
            reader.readAsDataURL(file);
        }
    };

    $scope.addText = function () {
        const text = new fabric.IText('TEXT HERE', {
            left: 100,
            top: 100,
            fontFamily: $scope.props.fontFamily,
            fill: $scope.props.fill,
            fontSize: $scope.props.fontSize,
            fontWeight: 'bold',
            stroke: $scope.props.stroke,
            strokeWidth: 0
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        $scope.setMode('select');
    };

    $scope.addRect = function () {
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: $scope.props.fill,
            width: 100,
            height: 100,
            stroke: $scope.props.stroke,
            strokeWidth: parseInt($scope.props.strokeWidth)
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        $scope.setMode('select');
    };

    $scope.addCircle = function () {
        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: $scope.props.fill,
            stroke: $scope.props.stroke,
            strokeWidth: parseInt($scope.props.strokeWidth)
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        $scope.setMode('select');
    };

    $scope.deleteSelected = function () {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => {
                canvas.remove(obj);
            });
        }
    };

    $scope.clearCanvas = function () {
        canvas.clear();
        canvas.setBackgroundColor($scope.canvasBg, canvas.renderAll.bind(canvas));
        $scope.hasImage = false;
        saveHistory();
    };

    $scope.updateProps = function () {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.set({
                fill: $scope.props.fill,
                stroke: $scope.props.stroke,
                strokeWidth: parseInt($scope.props.strokeWidth),
                opacity: parseFloat($scope.props.opacity)
            });

            if (activeObject.type === 'i-text') {
                activeObject.set({
                    fontSize: parseInt($scope.props.fontSize),
                    fontFamily: $scope.props.fontFamily
                });
            }
            canvas.requestRenderAll();
        }
        if ($scope.mode === 'draw') {
            canvas.freeDrawingBrush.color = $scope.props.stroke;
            canvas.freeDrawingBrush.width = parseInt($scope.props.strokeWidth);
        }
    };

    $scope.updateCanvasBg = function () {
        canvas.setBackgroundColor($scope.canvasBg, canvas.renderAll.bind(canvas));
    };

    $scope.toggleDraw = function () {
        $scope.setMode($scope.mode === 'draw' ? 'select' : 'draw');
    };

    $scope.setCanvasSize = function (w, h) {
        canvas.setDimensions({ width: w, height: h });
        canvas.renderAll();
    };

    $scope.loadTemplate = function (type) {
        canvas.clear();
        $scope.canvasBg = '#ffffff';
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));

        if (type === 'modern') {
            $scope.setCanvasSize(800, 800);
            const rect = new fabric.Rect({
                left: 0, top: 0, width: 800, height: 200, fill: '#ffffff', selectable: false
            });
            const text = new fabric.IText('When you fix one bug\nand 10 more appear', {
                left: 400, top: 100, originX: 'center', originY: 'center',
                fontFamily: 'Inter', fontSize: 40, textAlign: 'center', fill: '#000000'
            });
            canvas.add(rect, text);
        } else if (type === 'classic') {
            $scope.setCanvasSize(600, 600);
            const topText = new fabric.IText('TOP TEXT', {
                left: 300, top: 50, originX: 'center',
                fontFamily: 'Impact', fontSize: 60, fill: '#ffffff', stroke: '#000000', strokeWidth: 2
            });
            const bottomText = new fabric.IText('BOTTOM TEXT', {
                left: 300, top: 500, originX: 'center',
                fontFamily: 'Impact', fontSize: 60, fill: '#ffffff', stroke: '#000000', strokeWidth: 2
            });
            canvas.add(topText, bottomText);
        }
        $scope.hasImage = true;
    };

    $scope.downloadImage = function () {
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'edited-image.png';
        link.click();
    };

    $scope.share = function (platform) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Check out this Image Editor tool!');
        let shareUrl = '';
        switch (platform) {
            case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
            case 'telegram': shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
        }
        if (shareUrl) window.open(shareUrl, '_blank');
    };
});

app.controller('ImageCropperController', function ($scope, $timeout) {
    let cropper;
    $scope.imageSrc = null;

    $scope.handleFileSelect = function (element) {
        const file = element instanceof File ? element : element.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                $timeout(() => {
                    $scope.imageSrc = e.target.result;
                    // Destroy old cropper if exists
                    if (cropper) {
                        cropper.destroy();
                    }
                    // Initialize new cropper after DOM update
                    $timeout(() => {
                        const image = document.getElementById('image');
                        cropper = new Cropper(image, {
                            aspectRatio: NaN,
                            viewMode: 1,
                            preview: '.preview-container'
                        });
                    });
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Drag and Drop
    const dropZone = document.querySelector('.drop-zone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        dropZone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                $scope.handleFileSelect(files[0]);
            }
        }, false);
    }

    $scope.rotate = function (deg) {
        if (cropper) cropper.rotate(deg);
    };

    $scope.flipX = function () {
        if (cropper) cropper.scaleX(cropper.getData().scaleX === 1 ? -1 : 1);
    };

    $scope.flipY = function () {
        if (cropper) cropper.scaleY(cropper.getData().scaleY === 1 ? -1 : 1);
    };

    $scope.reset = function () {
        if (cropper) cropper.reset();
    };

    $scope.setAspectRatio = function (ratio) {
        if (cropper) cropper.setAspectRatio(ratio);
    };

    $scope.crop = function () {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas();
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'cropped-image.png';
                link.click();
            });
        }
    };

    $scope.share = function (platform) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('Check out this Image Cropper tool!');
        let shareUrl = '';

        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
        }

        if (shareUrl) window.open(shareUrl, '_blank');
    };
});

app.controller('PercentageController', function ($scope) {
    $scope.calc1 = {};
    $scope.calc2 = {};
    $scope.calc3 = {};
    $scope.calc4 = { type: 'plus' };

    $scope.calculate1 = function () {
        if ($scope.calc1.percent && $scope.calc1.number) {
            return ($scope.calc1.percent / 100) * $scope.calc1.number;
        }
        return 'Result';
    };

    $scope.calculate2 = function () {
        if ($scope.calc2.part && $scope.calc2.whole) {
            return (($scope.calc2.part / $scope.calc2.whole) * 100).toFixed(2) + '%';
        }
        return 'Result';
    };

    $scope.calculate3 = function () {
        if ($scope.calc3.from && $scope.calc3.to) {
            const diff = $scope.calc3.to - $scope.calc3.from;
            const percent = (diff / $scope.calc3.from) * 100;
            return (percent > 0 ? '+' : '') + percent.toFixed(2) + '%';
        }
        return 'Result';
    };

    $scope.calculate4 = function () {
        if ($scope.calc4.number && $scope.calc4.percent) {
            const amount = ($scope.calc4.percent / 100) * $scope.calc4.number;
            if ($scope.calc4.type === 'plus') {
                return $scope.calc4.number + amount;
            } else {
                return $scope.calc4.number - amount;
            }
        }
        return 'Result';
    };
});

app.controller('PdfMergeController', function ($scope, $timeout) {
    $scope.files = [];
    $scope.processing = false;

    $scope.handleFileSelect = function (element) {
        const newFiles = Array.from(element.files);
        $timeout(() => {
            $scope.files = [...$scope.files, ...newFiles];
        });
        element.value = '';
    };

    $scope.moveUp = function (index) {
        if (index > 0) {
            const temp = $scope.files[index];
            $scope.files[index] = $scope.files[index - 1];
            $scope.files[index - 1] = temp;
        }
    };

    $scope.moveDown = function (index) {
        if (index < $scope.files.length - 1) {
            const temp = $scope.files[index];
            $scope.files[index] = $scope.files[index + 1];
            $scope.files[index + 1] = temp;
        }
    };

    $scope.removeFile = function (index) {
        $scope.files.splice(index, 1);
    };

    $scope.clearAll = function () {
        $scope.files = [];
    };

    $scope.mergePdfs = async function () {
        $scope.processing = true;
        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const file of $scope.files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            download(pdfBytes, "merged.pdf", "application/pdf");
        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert("Error merging PDFs. Please check the files.");
        } finally {
            $timeout(() => {
                $scope.processing = false;
            });
        }
    };
});

app.controller('PdfSplitController', function ($scope, $timeout) {
    $scope.pdfFile = null;
    $scope.pageCount = 0;
    $scope.rangeFrom = 1;
    $scope.rangeTo = 1;

    $scope.handleFileSelect = async function (element) {
        const file = element.files[0];
        if (file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                $timeout(() => {
                    $scope.pdfFile = file;
                    $scope.pageCount = pdf.getPageCount();
                    $scope.rangeTo = $scope.pageCount;
                });
            } catch (error) {
                console.error("Error loading PDF:", error);
                alert("Invalid PDF file.");
            }
        }
    };

    $scope.splitRange = async function () {
        if (!$scope.pdfFile) return;
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const start = Math.max(0, $scope.rangeFrom - 1);
            const end = Math.min($scope.pageCount - 1, $scope.rangeTo - 1);

            const indices = [];
            for (let i = start; i <= end; i++) indices.push(i);

            const copiedPages = await newPdf.copyPages(srcPdf, indices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            download(pdfBytes, `split-${$scope.rangeFrom}-${$scope.rangeTo}.pdf`, "application/pdf");
        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert("Error splitting PDF.");
        }
    };

    $scope.splitAll = async function () {
        if (!$scope.pdfFile) return;
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const zip = new JSZip();

            for (let i = 0; i < $scope.pageCount; i++) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                zip.file(`page-${i + 1}.pdf`, pdfBytes);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "split-pages.zip");
        } catch (error) {
            console.error("Error splitting all pages:", error);
            alert("Error splitting pages.");
        }
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        $scope.pageCount = 0;
        document.getElementById('fileInput').value = '';
    };
});

app.controller('PdfOrganizeController', function ($scope, $timeout) {
    $scope.pdfFile = null;
    $scope.pages = [];
    $scope.loading = false;

    $scope.handleFileSelect = async function (element) {
        const file = element.files[0];
        if (file) {
            $scope.loading = true;
            $scope.pdfFile = file;
            $scope.pages = [];

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    $scope.$apply(() => {
                        $scope.pages.push({
                            originalIndex: i - 1,
                            rotation: 0
                        });
                    });
                    // Render preview
                    $timeout(() => renderPagePreview(pdf, i, i - 1));
                }
            } catch (error) {
                console.error("Error loading PDF:", error);
                alert("Error loading PDF.");
            } finally {
                $scope.$apply(() => {
                    $scope.loading = false;
                });
            }
        }
    };

    async function renderPagePreview(pdf, pageNum, index) {
        const page = await pdf.getPage(pageNum);
        const scale = 0.5;
        const viewport = page.getViewport({ scale: scale });
        const canvas = document.getElementById(`canvas-${index}`);
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
    }

    $scope.rotatePage = function (index) {
        $scope.pages[index].rotation = ($scope.pages[index].rotation + 90) % 360;
    };

    $scope.deletePage = function (index) {
        $scope.pages.splice(index, 1);
    };

    $scope.savePdf = async function () {
        if (!$scope.pdfFile) return;
        try {
            const { PDFDocument, degrees } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            const srcPdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            for (const pageData of $scope.pages) {
                const [copiedPage] = await newPdf.copyPages(srcPdf, [pageData.originalIndex]);
                copiedPage.setRotation(degrees(copiedPage.getRotation().angle + pageData.rotation));
                newPdf.addPage(copiedPage);
            }

            const pdfBytes = await newPdf.save();
            download(pdfBytes, "organized.pdf", "application/pdf");
        } catch (error) {
            console.error("Error saving PDF:", error);
            alert("Error saving PDF.");
        }
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        $scope.pages = [];
        document.getElementById('fileInput').value = '';
    };
});

app.controller('PdfSecurityController', function ($scope, $timeout) {
    $scope.mode = 'protect'; // protect or unlock
    $scope.pdfFile = null;
    $scope.password = '';
    $scope.confirmPassword = '';
    $scope.unlockPassword = '';

    $scope.setMode = function (mode) {
        $scope.mode = mode;
        $scope.reset();
    };

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            $timeout(() => {
                $scope.pdfFile = file;
            });
        }
    };

    $scope.protectPdf = async function () {
        if (!$scope.pdfFile || !$scope.password) return;
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);

            pdf.encrypt({
                userPassword: $scope.password,
                ownerPassword: $scope.password,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                },
            });

            const pdfBytes = await pdf.save();
            download(pdfBytes, "protected.pdf", "application/pdf");
        } catch (error) {
            console.error("Error protecting PDF:", error);
            alert("Error protecting PDF.");
        }
    };

    $scope.unlockPdf = async function () {
        if (!$scope.pdfFile || !$scope.unlockPassword) return;
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            // Try to load with password
            const pdf = await PDFDocument.load(arrayBuffer, { password: $scope.unlockPassword });

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            download(pdfBytes, "unlocked.pdf", "application/pdf");
        } catch (error) {
            console.error("Error unlocking PDF:", error);
            alert("Incorrect password or error unlocking PDF.");
        }
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        $scope.password = '';
        $scope.confirmPassword = '';
        $scope.unlockPassword = '';
        document.getElementById('fileInput').value = '';
    };
});

app.controller('PdfWatermarkController', function ($scope, $timeout) {
    $scope.pdfFile = null;
    $scope.text = 'CONFIDENTIAL';
    $scope.color = '#ff0000';
    $scope.opacity = 0.5;
    $scope.size = 50;
    $scope.rotation = -45;

    $scope.handleFileSelect = function (element) {
        const file = element.files[0];
        if (file) {
            $timeout(() => {
                $scope.pdfFile = file;
            });
        }
    };

    $scope.applyWatermark = async function () {
        if (!$scope.pdfFile) return;
        try {
            const { PDFDocument, rgb, degrees } = PDFLib;
            const arrayBuffer = await $scope.pdfFile.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages = pdf.getPages();

            // Convert hex color to RGB
            const r = parseInt($scope.color.substr(1, 2), 16) / 255;
            const g = parseInt($scope.color.substr(3, 2), 16) / 255;
            const b = parseInt($scope.color.substr(5, 2), 16) / 255;

            for (const page of pages) {
                const { width, height } = page.getSize();
                page.drawText($scope.text, {
                    x: width / 2 - ($scope.text.length * $scope.size) / 4,
                    y: height / 2,
                    size: $scope.size,
                    color: rgb(r, g, b),
                    opacity: parseFloat($scope.opacity),
                    rotate: degrees($scope.rotation),
                });
            }

            const pdfBytes = await pdf.save();
            download(pdfBytes, "watermarked.pdf", "application/pdf");
        } catch (error) {
            console.error("Error applying watermark:", error);
            alert("Error applying watermark.");
        }
    };

    $scope.reset = function () {
        $scope.pdfFile = null;
        document.getElementById('fileInput').value = '';
    };
});

// Recursive Directive for Tree View
app.directive('jsonTree', function ($compile) {
    return {
        restrict: 'E',
        scope: {
            data: '=',
            path: '='
        },
        link: function (scope, element) {
            // Helper to determine type
            scope.getType = function (val) {
                if (val === null) return 'null';
                if (Array.isArray(val)) return 'array';
                return typeof val;
            };

            scope.copyPath = function (key) {
                let fullPath = scope.path ? scope.path + '.' + key : key;
                // Handle array indices in path if needed, simplified here
                if (fullPath.startsWith('.')) fullPath = fullPath.substring(1);

                navigator.clipboard.writeText(fullPath).then(() => {
                    scope.$emit('path-copied', fullPath);
                });
            };

            // Watch for data changes to re-render
            scope.$watch('data', function (newData) {
                if (newData === undefined || newData === null) return;

                let html = '<ul class="list-unstyled ps-3">';

                if (typeof newData === 'object' && newData !== null) {
                    for (let key in newData) {
                        let val = newData[key];
                        let type = scope.getType(val);
                        let currentPath = scope.path ? scope.path + (Array.isArray(scope.data) ? `[${key}]` : `.${key}`) : (Array.isArray(scope.data) ? `[${key}]` : key);

                        html += `<li>`;
                        html += `<span class="tree-key fw-bold" ng-click="copyPath('${key}')">"${key}"</span>: `;

                        if (type === 'object' || type === 'array') {
                            html += `<span class="text-muted">{...}</span>`;
                            html += `<json-tree data="data['${key}']" path="'${currentPath}'"></json-tree>`;
                        } else {
                            let displayVal = type === 'string' ? `"${val}"` : val;
                            html += `<span class="tree-${type}">${displayVal}</span>`;
                        }
                        html += `</li>`;
                    }
                }

                html += '</ul>';
                element.html(html);
                $compile(element.contents())(scope);
            });
        }
    };
});

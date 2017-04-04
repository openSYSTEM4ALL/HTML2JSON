var app = angular.module('myApp', ['ngRoute','ngSanitize']);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {

    $routeProvider.when("/about", {
        controller: "aboutController",
        templateUrl: "templates/about.html"
    });
    $routeProvider.when("/", {
        controller: "entryGenerateController",
        templateUrl: "templates/generate-entry.html"
    });
    $routeProvider.otherwise({
        redirectTo: '/'
    });
    //if (window.history && window.history.pushState) {

    //    $locationProvider.html5Mode({
    //        enabled: true,
    //        requireBase: false
    //    });
    //}
}]);

app.controller('entryGenerateController', ["$scope", "$http", function ($scope, $http) {
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        mode: "application/x-ejs",
        indentUnit: 4,
        indentWithTabs: true,
        theme: "monokai"
    });
    var editorf = CodeMirror.fromTextArea(document.getElementById("codef"), {
        lineNumbers: true,
        mode: "application/x-ejs",
        indentUnit: 4,
        indentWithTabs: true,
        theme: "monokai",
        readOnly: true
    });

    function updateTextArea() {
        editor.save();
        console.log('do something');
    }

    editor.on('change', updateTextArea);

    $scope.extractText = function () {
        var result = extractTextFromHTML(editor.doc.getValue());
        var jsonObject = {};
        result.forEach(function (s) {
            s = s.trim();
            s = s.replace(/ +(?= )/g, '');
            var str = s.replace(/ /g, "\n");
            var r = nlp(str);
            if (s.length > 3) {
                var nouns = r.topics().out('array');
                if (nouns.length > 0) {
                    if (nouns.length > 1) {
                        var key = nouns[0].trim() + '_' + nouns[1].trim();
                        jsonObject[key] = s;
                    } else {
                        jsonObject[nouns[0].trim()] = s;
                    }

                } else {
                    // no topics  found
                    var topics = r.nouns().out('array');
                    if (topics.length > 0) {
                        if (topics.length > 1) {
                            var key_t = topics[0].trim() + '_' + topics[1].trim();
                            jsonObject[key_t] = s;
                        } else {
                            jsonObject[topics[0].trim()] = s;
                        }

                    } else {
                        // no nouns found
                        var words = s.split(' ');
                        if (words.length > 1) {
                            var key_w = words[0].trim() + '_' + words[1].trim();
                            jsonObject[key_w] = s;
                        } else {
                            jsonObject[words[0].trim()] = s;
                        }

                    }

                }
            }
        });
        console.log(jsonObject);
        editorf.doc.setValue(JSON.stringify(jsonObject, null, "\t"));
    }


    function extractTextFromHTML(html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        // removing script and noscript elements
        var scripts = tmp.getElementsByTagName('script');
        var i = scripts.length;
        while (i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }
        $(tmp).find('noscript').remove();
        var content = tmp.textContent || tmp.innerText;
        content = content.replace(/^\s*[\r\n]/gm, '').split('\n').map(Function.prototype.call, String.prototype.trim);
        content = removeDuplicate(content);
        return content;
    }

    function removeDuplicate(list) {
        var result = [];
        $.each(list, function (i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    }

}]);


app.controller('aboutController', ["$scope", "$http", "$sce",function ($scope, $http,$sce) {
    $http.get("/readme.md").then(function (res) {
        var article = res.data;
        var html = markdown.toHTML(article);
        $scope.html = html;
      
        $sce.trustAsHtml($scope.html);
    });
}]);
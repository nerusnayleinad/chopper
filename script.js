var input_urls = document.getElementById('urls');
var results = document.getElementById('results');
var go = document.getElementById("remove");
var remove = document.getElementsByName("radio")[0];
var column = document.getElementsByName("radio")[1];
var quotes = document.getElementsByName("radio")[2];
var resume = document.getElementById("status");
var duplicates = document.getElementById("duplicates");

function remove_http(urls) {
	urls = urls.replace(/[\n\r ]/g, ",");
	urls = urls.split(",");
	
	for(var i=0; i<urls.length; ++i) {
		var first_occ = (urls[i].indexOf("//") === -1) ? 0 : (urls[i].indexOf("//") + 2);
		var last_occ = (urls[i].lastIndexOf("/") === (urls[i].length - 1)) ? (urls[i].length - 1) : urls[i].length;
		urls[i] = urls[i].substring(first_occ, last_occ);
	}
	
	return urls;
}

function remove_duplicates(urls) {
    var removed_urls = [];
	var filtered_urls = urls.filter(function(url, index) {
	    if(url === ''){
	        return false;
	    }
	    
        //return (urls.indexOf(url) != index) ? (() => {removed_urls.push(url); return false})() : (urls.indexOf(url) == index);            //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions
        return urls.indexOf(url) != index ? (removed_urls.push(url) == -1) : (urls.indexOf(url) == index);
    })
    
    //Array of filtered URLs. No duplicates
    resume.innerHTML = "Removed " + removed_urls.length + " duplicates." + "\n" +
                       "Filtered " + filtered_urls.length + " URLs.";
                       
    duplicates.innerHTML = removed_urls.join("\n");
    return filtered_urls;
}

function check_checked_radio() {
    var radios = document.getElementsByName("radio");
    for(var i=0; i<radios.length; ++i) {
        if(radios[i].checked)
        return radios[i].value;
    }
}

go.addEventListener('click', function() {
	var urls = input_urls.value;
	if(urls === '') {
	    resume.innerHTML = "No URLs found."
	    return
	}
	
	urls = remove_http(urls);									//removing http:// and https://
    urls = remove_duplicates(urls);								//removing duplicates
    
    //var duplicate_urls = [];
    //results.innerHTML = quotes.checked ? ("\'" + urls.join("','") + "\'") : urls;
    //results.innerHTML = column.checeked ? urls.join("\n") : urls;
    
    var checked_radio = check_checked_radio();
    //switching to switch to make the app scalable
    switch(checked_radio) {
        case "remove":
            results.innerHTML = urls;
            break;
        case "column":
            results.innerHTML = urls.join("\n");
            break;
        case "quotes":
            results.innerHTML = "\'" + urls.join("','") + "\'";
            break;
        default:
            break;
    }
})
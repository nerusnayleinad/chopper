var go = document.getElementById('remove');
var remove = document.getElementsByName("radio")[0];
var column = document.getElementsByName("radio")[1];
var quotes = document.getElementsByName("radio")[2];

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
	var filtered_urls = urls.filter(function(url, index) {       
    	return urls.indexOf(url) == index;
    })
    
    //Array of filtered URLs. No duplicates
    var removed_urls = urls.length - filtered_urls.length;
    console.log("Removed " + removed_urls + " duplicate URLs.");
    console.log(filtered_urls);
    return filtered_urls;
}


go.addEventListener('click', function() {
	var urls = document.getElementById('urls').value;
	urls = remove_http(urls);									//removing http:// and https://
    urls = remove_duplicates(urls);								//removing duplicates
    document.getElementById('results').innerHTML = quotes.checked ? ("\'" + urls.join("','") + "\'") : urls;
    //console.log(urls);
    
    if(column.checked) {
    	var result = urls[0] + "\n";
    	for(var i=1; i<urls.length; ++i) {
    		//console.log(i + ".-" + urls[i])
    		result = result + urls[i] + "\n";
    	}
    	document.getElementById('results').innerHTML = result;
    }
})
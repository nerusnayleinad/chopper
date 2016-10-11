var input_urls = document.getElementById('urls');
var results = document.getElementById('results');
var go = document.getElementById("remove");
var remove = document.getElementsByName("radio")[0];
var column = document.getElementsByName("radio")[1];
var quotes = document.getElementsByName("radio")[2];
var resume = document.getElementById("status");
var duplicates = document.getElementById("duplicates");
var report_details = { removed_urls: 0, removed_private: 0, filtered_urls: 0 };         //object that contains the summary of the operation
var blacklisted_domains = [];
var google_domains = [];

$(document).ready(function() {
        $.ajax({
            type: "GET",
            url: "blacklisted_domains.csv",                  //parses to string
            success: function (data, status) { 
                blacklisted_domains = data.split(",\n");
            },
            error: function(errno, status) {
                console.log("Error occurred: " + status);
            }
        }); 
        
        $.ajax({
            type: "GET",
            url: "google_domains.csv",                  //parses to string
            success: function (data, status) { 
                google_domains = data.split(",\n");
            },
            error: function(errno, status) {
                console.log("Error occurred: " + status);
            }
        }); 
})

function process_data(data) {
    console.log(data);
}

function report() {
    //Array of filtered URLs. No duplicates
   resume.innerHTML = "Removed " + report_details["removed_urls"] + " duplicates." + "\n" +
                      "Removed " + report_details["removed_private"] + " private IPs/networks." + "\n" +
                      "Filtered " + report_details["filtered_urls"] + " URLs." + "\n"; 
}

function filter_local_machine(urls) {
    var removed_local_urls = [];
    var second_octet;                                               //172.xxx.0.0   second_octet = xxx
    //urls.forEach(function(url, index) {
    for(var i = urls.length - 1; i >= 0; --i) {
        if(urls[i].startsWith("172.")) {                            //172.16.0.0 to 172.31.255.255 are private networks
            second_octet = urls[i].split(".")[1];
            
            if((second_octet >= 16) && (second_octet < 32)) {
                removed_local_urls.push(urls[i]);
                urls.splice(i, 1);
            }
        }
        else
            if(urls[i].startsWith("0.") ||
               urls[i].startsWith("10.") || 
               urls[i].startsWith("127.") || 
               urls[i].startsWith("192.168.") ||
               urls[i].startsWith("localhost") ||
               urls[i].startsWith("intranet")) {
                   
                removed_local_urls.push(urls[i]);
                urls.splice(i, 1);
            }
    }
    
    report_details["removed_private"] = removed_local_urls.length;
    return urls;
}

function remove_http(urls) {
	urls = urls.replace(/[\n\r ]/g, ",");
	urls = urls.split(",");
	
	for(var i=0; i<urls.length; ++i) {
		var first_occ = (urls[i].indexOf("//") === -1) ? 0 : (urls[i].indexOf("//") + 2);
		var last_occ = (urls[i].lastIndexOf("/") === (urls[i].length - 1)) ? (urls[i].length - 1) : urls[i].length;
		urls[i] = urls[i].substring(first_occ, last_occ);
	}
	//console.log(urls);
	return urls;
}


/*function remove_blacklisted_domains (urls) {
    urls = urls.filter(function(url) {
      return blacklisted_domains.indexOf(url) < 0;
    } );
    return urls;
}*/


/*
function remove_blacklisted_domains (urls) {
    urls = urls.filter(function(url, index) {
        return blacklisted_domains.indexOf(url) === -1;    
    });
    return urls;
}
*/

//////////////////FIX THIS SHIT/////////////////////DONE

function remove_blacklisted_domains (urls) {
    urls = urls.filter(function(url) {
        for(var i=0; i<blacklisted_domains.length; ++i) {
            if(url.indexOf(blacklisted_domains[i]) !== -1)
            break;
                else if(i === blacklisted_domains.length - 1)
                return true;
        }
    })
    console.log(urls);
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
    
    report_details["removed_urls"] = removed_urls.length;
    report_details["filtered_urls"] = filtered_urls.length;
                       
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
	urls = filter_local_machine(urls);
	urls = remove_blacklisted_domains(urls);
    urls = remove_duplicates(urls);								//removing duplicates
    
    report();
    
    
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

/*
setTimeout(function() {
    remove_blacklisted_domains(["google.com", "hola.com"]);
}, 100);
*/
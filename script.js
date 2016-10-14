var input_urls = document.getElementById('urls');
var results = document.getElementById('results');
var go = document.getElementById("remove");
var remove = document.getElementsByName("radio")[0];
var column = document.getElementsByName("radio")[1];
var quotes = document.getElementsByName("radio")[2];
var resume = document.getElementById("summary");
var removed_urls = document.getElementById("removed_urls");
var report_details = { removed_duplicates: 0, removed_private: 0, removed_blacklisted: 0, filtered_urls: 0 };         //object that contains the summary of the operation
var blacklisted_domains = [];
var removed_duplicate_urls = [];
var removed_local_urls = [];
var removed_blacklisted_urls = []
var filtered_urls = [];

$(document).ready(function() {
        $.ajax({
            type: "GET",
            url: "blacklisted_domains.csv",                  //parses to string
            success: function (data, status) { 
                blacklisted_domains = data.split(",\n");
            },
            error: function(errno, status) {
                console.log("Error occurred: " + errno);
            }
        });
})

function init() {
    removed_duplicate_urls = [];
    removed_local_urls = [];
    removed_blacklisted_urls = []
    filtered_urls = [];
}

//This function will compare 2 arrays, will remove the common elements from array_1
//and will return the array without those.
function remove_common_elements(array_1, array_2) {
    array_1 = array_1.filter(function(el) {
        return array_2.indexOf(el) === -1;
    })
    
    return array_1;
}


function summary_report() {
    report_details["removed_duplicates"] = removed_duplicate_urls.length;
    report_details["removed_private"] = removed_local_urls.length;
    report_details["removed_blacklisted"] = removed_blacklisted_urls.length;
    report_details["filtered_urls"] = filtered_urls.length;
   
    resume.innerHTML = "Removed " + report_details["removed_duplicates"] + " duplicates." + "\n" +
                       "Removed " + report_details["removed_private"] + " private IPs/networks." + "\n" +
                       "Removed " + report_details["removed_blacklisted"] + " blacklisted domains." + "\n" +
                       "Filtered " + report_details["filtered_urls"] + " URLs." + "\n";
                       
    if(!removed_duplicate_urls.length) removed_duplicate_urls = ["No duplicates..."];
    if(!removed_local_urls.length) removed_local_urls = ["No local addresses..."];
    if(!removed_blacklisted_urls.length) removed_blacklisted_urls = ["No blacklisted domains..."];
                      
    removed_urls.innerHTML = "> Duplicates" + "\n" + removed_duplicate_urls.join("\n") + "\n\n" +
                             "> Local" + "\n" + removed_local_urls.join("\n") + "\n\n" +
                             "> Blacklisted" + "\n" + removed_blacklisted_urls.join("\n");
}


function filter_local_machine(urls) {
    var second_octet;                                               //172.xxx.0.0   second_octet = xxx
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


//Removes a domain in case it INCLUDES a domain from the blacklisted domains
//PROBLEM: it removes google.comiendo -> RESOLVED
function remove_blacklisted_domains (urls) {
    var report_aux = urls;
    urls = urls.filter(function(url) {
        for(var i=0; i<blacklisted_domains.length; ++i) {
            if((url.indexOf(blacklisted_domains[i]) !== -1) && (url.substring(url.lastIndexOf(".")) === blacklisted_domains[i].substring(blacklisted_domains[i].lastIndexOf("."))))
            break;
                else if(i === blacklisted_domains.length - 1)
                return true;
        }
    })
    
    removed_blacklisted_urls = remove_common_elements(report_aux, urls);
    return urls;
}


function remove_duplicates(urls) {
	    filtered_urls = urls.filter(function(url, index) {
	    if(url === ''){
	        return false;
	    }
	    
        //return (urls.indexOf(url) != index) ? (() => {removed_urls.push(url); return false})() : (urls.indexOf(url) == index);            //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions
        return urls.indexOf(url) != index ? (removed_duplicate_urls.push(url) == -1) : (urls.indexOf(url) == index);
    })
    
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
    init();
	var urls = input_urls.value;
	if(urls === '') {
	    resume.innerHTML = "No URLs found."
	    return
	}
	
	urls = remove_http(urls);									//removing http:// and https://
	urls = filter_local_machine(urls);
	urls = remove_duplicates(urls);								//removing duplicates
	urls = remove_blacklisted_domains(urls);
    
    summary_report();

    
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
var input_urls = document.getElementById('urls');
var results = document.getElementById('results');
var go = document.getElementById("remove");
var resume = document.getElementById("summary");
var removed_urls = document.getElementById("removed_urls");
var clipboard = document.getElementById("clipboard");
var blacklisted_domains = [];

class urls_manager {
    constructor(urls) {
        this.urls = urls;
        
        $.ajax({
            type: "GET",
            url: "files/blacklisted_domains.csv",                  //parses to string
            success: function (data, status) { 
                blacklisted_domains = data.split(",\n");
            },
            error: function(errno, status) {
                console.log("Couldn't load the .csv file with blacklisted domains.");
                console.log("loading js_blacklisted_domains...");
                blacklisted_domains = js_blacklisted_domains;
            }
        });
    }
    
    //removes "http://" or/and "https://" from a given domain. Also removes the last slash, if there is.
    remove_http(urls) {
    	urls = urls.replace(/[\n\r ]/g, ",");
    	urls = urls.split(",");
    	
    	for(var i=0; i<urls.length; ++i) {
    		var first_occ = (urls[i].indexOf("//") === -1) ? 0 : (urls[i].indexOf("//") + 2);
    		var last_occ = (urls[i].lastIndexOf("/") === (urls[i].length - 1)) ? (urls[i].length - 1) : urls[i].length;
    		urls[i] = urls[i].substring(first_occ, last_occ);
    	}

    	return urls;
    }
    
    filter_local_machine(urls) {
        var second_octet;                                               //172.xxx.0.0   second_octet = xxx
        var _removed_local_urls = [];
        for(var i = urls.length - 1; i >= 0; --i) {
            if(urls[i].startsWith("172.")) {                            //172.16.0.0 to 172.31.255.255 are private networks
                second_octet = urls[i].split(".")[1];
                
                if((second_octet >= 16) && (second_octet < 32)) {
                    _removed_local_urls.push(urls[i]);
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
                       
                   _removed_local_urls.push(urls[i]);
                   urls.splice(i, 1);
                }
        }
        
        return [urls, _removed_local_urls];
    }
    
    //given 2 arrays; removes the common elements from the first one and returns it
    remove_common_elements(arr_1, arr_2) {
        arr_1 = arr_1.filter(function(el) {
            return arr_2.indexOf(el) === -1;
        })
        
        return arr_1;
    }
    
    //removes duplicated elements from an array
    remove_duplicated_elements(arr) {
        var _duplicate_elements = [];
        var _filteres_elements = arr.filter(function(el, index) {
            if(el === '') return false;
            
            return arr.indexOf(el) != index ? (_duplicate_elements.push(el) == -1) : (arr.indexOf(el) == index);
        })
        
        return [_filteres_elements, _duplicate_elements];
    }

    //removed domains from a .csv file
    //request sent through ajax
    remove_blacklisted_domains(urls) {
        var aux = urls;
        var _removed_blacklisted_urls = [];
        urls = urls.filter(function(url) {
            for(var i=0; i<blacklisted_domains.length; ++i) {
                if((url.indexOf(blacklisted_domains[i]) !== -1) && (url.substring(url.lastIndexOf(".")) === blacklisted_domains[i].substring(blacklisted_domains[i].lastIndexOf("."))))
                break;
                    else if(i === blacklisted_domains.length - 1)
                    return true;
            }
        })
        
        _removed_blacklisted_urls = this.remove_common_elements(aux, urls);
        return [urls, _removed_blacklisted_urls];
    }
    
    summary_report(removed_duplicate_urls, removed_local_urls, removed_blacklisted_urls, filtered_urls) {
        var report_details = {                                                   //object that contains the summary of the operation
            removed_duplicates: removed_duplicate_urls.length,
            removed_private: removed_local_urls.length,
            removed_blacklisted: removed_blacklisted_urls.length,
            filtered_urls: filtered_urls.length
        };        
       
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
}

function check_checked_radio() {
    var radios = document.getElementsByName("radio");
    for(var i=0; i<radios.length; ++i) {
        if(radios[i].checked)
        return radios[i].value;
    }
}

function copy_to_clipboard(element) {
    element.select();
    document.execCommand('copy');
}


go.addEventListener('click', function() {
    var removed_duplicate_urls = [];
    var removed_local_urls = [];
    var removed_blacklisted_urls = [];
    var filtered_urls = [];

	var introduced_urls = input_urls.value;
	if(introduced_urls === '') {
	    resume.innerHTML = "No URLs introduced.";
	    return;
	}
	
	filtered_urls = urls.remove_http(introduced_urls);									//removing http:// and https://
	removed_local_urls = urls.filter_local_machine(filtered_urls)[1];
	filtered_urls = urls.filter_local_machine(filtered_urls)[0];
	removed_duplicate_urls = urls.remove_duplicated_elements(filtered_urls)[1];
	filtered_urls = urls.remove_duplicated_elements(filtered_urls)[0];								//removing duplicates
	removed_blacklisted_urls = urls.remove_blacklisted_domains(filtered_urls)[1];
	filtered_urls = urls.remove_blacklisted_domains(filtered_urls)[0];
    
    urls.summary_report(removed_duplicate_urls, removed_local_urls, removed_blacklisted_urls, filtered_urls);

    
    var checked_radio = check_checked_radio();
    //switching to switch to make the app scalable
    switch(checked_radio) {
        case "remove":
            results.innerHTML = filtered_urls;
            break;
        case "column":
            results.innerHTML = filtered_urls.join("\n");
            break;
        case "quotes":
            results.innerHTML = "\'" + filtered_urls.join("','") + "\'";
            break;
        default:
            break;
    }
    
    if(clipboard.checked)
    copy_to_clipboard(results);
});

var urls = new urls_manager();

	
	var INVALID_FILE = 'Please upload a valid data file in CSV format!',
		contactType = { 'email':'e', 'mobile':'m' };
	
	function handleFiles(files) {
		for(var i=0;i<files.length;i++){
			var file=files[i];
			if(file.name.match(/\.csv$/)) {
				readFile(file);
				$('#export').show();
			} else {
				alert(INVALID_FILE);
			}
		}
	}
	
	function parseCSV(content) {
		var rows = content.split('\n'),
			lines = '';
		
		for(var i=0;i<rows.length;i++){
			var array = [],
				cols = rows[i].split(',');
			
			if(cols[0].length<=0) continue;
			
			array.push(cols[0]);
			array.push(cols[1]);
			array.push(cols[2]);
			array.push(cols[3]);
			
			if (i==0) {
				array.push('mobile');
				array.push('email');
			} else if(cols[12]) {
				var details = cols[12].split(';');
				array.push(getContactDetails(details,contactType.mobile));
				array.push(getContactDetails(details,contactType.email));
			}
			lines += array.join(',') + '\r\n<br />';
		}
		
		return lines;
	}
	
	function getContactDetails(detailsArray, type) {
		var detail = '';
		for (var i=0;i<detailsArray.length;i++) {
			var pattern = '^' + type + ': (.+)$',
				matches = detailsArray[i].match(pattern);
			if(matches && matches.length==2) {
				detail = matches[1];
				break;
			}
		}
		return detail;
	}
	
	function getValue(applicant,tag) {
		var node = applicant.getElementsByTagName(tag)[0].childNodes[0];
		if (node) {
			return node.nodeValue;
		} else {
			return '';
		}
	}
	
	function readFile(file) {
		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
			  // Render thumbnail.
			  if(e.target.result.length<=0) {
				alert(INVALID_FILE);
				throw ('Invalid file uploaded');
			  }
			  
			  $('#list').html(parseCSV(e.target.result));
			};
		})(file)
		
		reader.readAsText(file);
	}
	
	function exportFile() {
		var 
			csvContent = 'data:text/csv;charset=utf-8,',
			encodedUri = '';
		
		if($('#list').html().length>0) {
			csvContent += $('#list').html().replace(/<br>/g,'');
			link = document.createElement('a');
			link.setAttribute('href', encodeURI(csvContent));
			link.setAttribute('download', 'mailchimp-data.csv');
			link.click();
		}
	}
	
	$(function(){
		$('#export input').click(exportFile);
	});
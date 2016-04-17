# Simple XHR Uploader
Queued file upload plugin for jQuery.

# Requirements
- jQuery (tested with 1.9.1)
- [FormData](https://developer.mozilla.org/en/docs/Web/API/FormData#Browser_compatibility) and [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_compatibility) on browser

# Usage
```html
<input type="file" name="photo" id="photo" data-url="upload.php" />
<div id="browse" data-multiple="1"></div>

<script type="text/javascript">
// Simple usage
$("#photo").uploader();
// Passing some options
$("#browse").uploader({
  url: "upload.php",
  multiple: false, // Overwrite "data-multiple" attribute
  progress: function(loaded, total) {
    var loadedInPercentage = Math.round(loaded * 100 / total);
    console.log(loadedInPercentage + "%")
  },
  xhr: { // For each XHR on the queue
    start: function() {
      console.log("New progress has started");
    }
  }
});
</script>
```

# Options
<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Type</th>
			<th>Default</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>name</td>
			<td>String</td>
			<td>"file"</td>
			<td>Input name</td>
		</tr>
		<tr>
			<td>url</td>
			<td>String</td>
			<td>Required</td>
			<td>Server to post</td>
		</tr>
		<tr>
			<td>multiple</td>
			<td>Boolean</td>
			<td>false</td>
			<td>Allows multiple file selection on file browser</td>
		</tr>
		<tr>
			<td>accept</td>
			<td>Array</td>
			<td>null</td>
			<td>Accepted file types</td>
		</tr>
		<tr>
			<td>defaulProgressBar</td>
			<td>Boolean</td>
			<td>true</td>
			<td>Initialize the default progress bar</td>
		</tr>
		<tr>
			<td>data</td>
			<td>Object</td>
			<td>null</td>
			<td>Extra data to send to server</td>
		</tr>
		<tr>
			<td>start</td>
			<td>Function</td>
			<td>null</td>
			<td>"On start" event handler</td>
		</tr>
		<tr>
			<td>progress</td>
			<td>Function</td>
			<td>null</td>
			<td>"On progress" event handler</td>
		</tr>
		<tr>
			<td>complete</td>
			<td>Function</td>
			<td>null</td>
			<td>"On complete" event handler</td>
		</tr>
		<tr>
			<td>xhr.before</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On before" event handler</td>
		</tr>
		<tr>
			<td>xhr.start</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On start" event handler</td>
		</tr>
		<tr>
			<td>xhr.progress</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On progress" event handler</td>
		</tr>
		<tr>
			<td>xhr.success</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On success" event handler</td>
		</tr>
		<tr>
			<td>xhr.complete</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On complete" event handler</td>
		</tr>
		<tr>
			<td>xhr.error</td>
			<td>Function</td>
			<td>null</td>
			<td>Each request's "On error" event handler</td>
		</tr>
	</tbody>
</table>

# License
MIT
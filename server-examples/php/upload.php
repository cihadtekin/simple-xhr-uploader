<?php
//////////////
// Settings //
//////////////

// Content type
header('Content-Type: application/json');
/**
 * Main directory for uploaded files
 */
define('UPLOAD_FOLDER', '../../files');
/**
 * File input's name
 */
define('INPUT_NAME', 'file');
/**
 * Accepted extensions
 */
define('ACCEPT', 'jpg,png,gif');
/**
 * Uploaded file's mode
 */
define('FILE_MODE', 0775);
/**
 * Created directories' mod
 */
define('DIR_MODE', 0775);
/**
 * Allow creating nested directories
 */
define('MKDIR_RECURSIVE', 1);
/**
 * Exception handler for throws
 */
set_exception_handler(function($e) {
  header('HTTP/1.0 500 Internal Server Error');
  echo json_encode(array(
    'error' => true,
    'message' => $e->getMessage()
  ));
});

////////////
// Errors //
////////////

$errors = array(
  'empty_input'         => 'File not received.',
  'permission_denied'   => 'Unable to move file, check permissions.',
  'invalid_file_type'   => 'Invalid file type (Accepted types: '. ACCEPT .').',
  UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize '.
                           'directive in php.ini.',
  UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive '.
                           'that was specified in the HTML form.',
  UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
  UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
  UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
  UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
  UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload. PHP does not '.
                           'provide a way to as certain which extension caused the '.
                           'file upload to stop. Examining the list of loaded '.
                           'extensions with phpinfo() may help.'
);

///////////////
// Execution //
///////////////

// File
$file = ! empty($_FILES[INPUT_NAME])
  ? $_FILES[INPUT_NAME]
  : null;

// Check file
if (is_null($file)) {
  throw new Exception($errors['empty_input']);
}

// Check errors
if ($file['error'] !== UPLOAD_ERR_OK) {
  throw new Exception( $errors[ $file['error'] ] );
}

// Folder name for this upload
$folder = ! empty($_POST['folder'])
  ? $_POST['folder'] . DIRECTORY_SEPARATOR
  : '';

// Root directory name
$dir = UPLOAD_FOLDER . DIRECTORY_SEPARATOR . $folder;

// File parameters
$info = pathinfo($file['name']);
$ext = $info['extension'] ? '.' . $info['extension'] : '';
$name = $info['filename'];

// Check file types
if ( ACCEPT AND ! in_array($info['extension'], explode(',', ACCEPT)) ) {
  throw new Exception($errors['invalid_file_type']);
}

// Mkdir if dir does not exists
if ( ! file_exists($dir) ) {
  $old_umask = umask(0);
  $result = @mkdir($dir, DIR_MODE, !!MKDIR_RECURSIVE);
  umask($old_umask);
  if ( ! $result ) {
    throw new Exception($errors['permission_denied']);
  }
}

// Find a unique file name
$i = 1;
$tmp = $name;
while (file_exists($dir . $tmp . $ext)) {
  $tmp = $name . '-' . $i;
  $i++;
}
$filename = $dir . $tmp . $ext;

// Move the file
$result = @move_uploaded_file($file['tmp_name'], $filename);

if ( ! $result ) {
  throw new Exception($errors['permission_denied']);
}

$old_umask = umask(0);
chmod($filename, FILE_MODE);
umask($old_umask);

// Response
echo json_encode(array(
  'file' => $filename,
  'name' => $tmp . $ext,
  'ext' => $ext,
  'message' => 'File saved',
  'error' => false
));

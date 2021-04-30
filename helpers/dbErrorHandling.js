'use strict';
/*
------------------
Get Unique Error field name
------------------
*/

const uniqueMessage = error => {
    let output;

    try {
        let fieldName = error.message.split('.$')[1];
        field = field.split('dub key')[0];
        field = field.subString(0, field.lastIndexOf('_'));
        req.flash('error', [{
            msg: `An account with this ${field} already exists`
        }]);
        output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + "already exists";
    } catch (error) {
        output = "already exists";
    }

    return output;
}

/*
------------------
Get the error message from error object
------------------
*/
exports.errorHandler = error => {
    let message = "";

    if (error.code) {
        switch (error.code) {
            case 11000:
            case 11001:
                message = uniqueMessage(error);
                break;
            default:
                message = "Something went wrong";
        }
    } else {
        for (let errorName in error.errors) {
            if (error.errors[errorName].message)
                message = error.errors[errorName].message;
        }
    }

    return message;
};
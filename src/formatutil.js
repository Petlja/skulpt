Sk.builtin.replFunc = function (value, conversionFlags, fieldWidth, precision, precbody, conversionType) {
    var result;
    var convName;
    var convValue;
    var base;
    var r;
    var mk;
    var handleWidth;
    var formatNumber;
    var alternateForm;
    var precedeWithSign;
    var blankBeforePositive;
    var leftAdjust;
    var zeroPad;
    fieldWidth = Sk.builtin.asnum$(fieldWidth);
    precision = Sk.builtin.asnum$(precision);


    if (precision === "") { // ff passes '' here aswell causing problems with G,g, etc.
        precision = undefined;
    }

    zeroPad = false;
    leftAdjust = false;
    blankBeforePositive = false;
    precedeWithSign = false;
    alternateForm = false;
    if (conversionFlags) {
        if (conversionFlags.indexOf("-") !== -1) {
            leftAdjust = true;
        } else if (conversionFlags.indexOf("0") !== -1) {
            zeroPad = true;
        }

        if (conversionFlags.indexOf("+") !== -1) {
            precedeWithSign = true;
        } else if (conversionFlags.indexOf(" ") !== -1) {
            blankBeforePositive = true;
        }

        alternateForm = conversionFlags.indexOf("#") !== -1;
    }

    if (precision) {
        precision = parseInt(precision.substr(1), 10);
    }

    formatNumber = function (n, base) {
        var precZeroPadded;
        var prefix;
        var didSign;
        var neg;
        var r;
        var j;
        base = Sk.builtin.asnum$(base);
        neg = false;
        didSign = false;
        if (typeof n === "number") {
            if (n < 0) {
                n = -n;
                neg = true;
            }
            r = n.toString(base);
        } else if (n instanceof Sk.builtin.float_) {
            r = n.str$(base, false);
            if (r.length > 2 && r.substr(-2) === ".0") {
                r = r.substr(0, r.length - 2);
            }
            neg = n.nb$isnegative();
        } else if (n instanceof Sk.builtin.int_) {
            r = n.str$(base, false);
            neg = n.nb$isnegative();
        } else if (n instanceof Sk.builtin.lng) {
            r = n.str$(base, false);
            neg = n.nb$isnegative();
        }

        goog.asserts.assert(r !== undefined, "unhandled number format");

        precZeroPadded = false;

        if (precision) {
            //print("r.length",r.length,"precision",precision);
            for (j = r.length; j < precision; ++j) {
                r = "0" + r;
                precZeroPadded = true;
            }
        }

        prefix = "";

        if (neg) {
            prefix = "-";
        } else if (precedeWithSign) {
            prefix = "+" + prefix;
        } else if (blankBeforePositive) {
            prefix = " " + prefix;
        }

        if (alternateForm) {
            if (base === 16) {
                prefix += "0x";
            } else if (base === 8 && !precZeroPadded && r !== "0") {
                prefix += "0";
            }
        }

        return [prefix, r];
    };

    handleWidth = function (args) {
        var totLen;
        var prefix = args[0];
        var r = args[1];
        var j;
        if (fieldWidth) {
            fieldWidth = parseInt(fieldWidth, 10);
            totLen = r.length + prefix.length;
            if (zeroPad) {
                for (j = totLen; j < fieldWidth; ++j) {
                    r = "0" + r;
                }
            } else if (leftAdjust) {
                for (j = totLen; j < fieldWidth; ++j) {
                    r = r + " ";
                }
            } else {
                for (j = totLen; j < fieldWidth; ++j) {
                    prefix = " " + prefix;
                }
            }
        }
        return prefix + r;
    };


    base = 10;
    if (conversionType === "d" || conversionType === "i") {
        return handleWidth(formatNumber(value, 10));
    } else if (conversionType === "o") {
        return handleWidth(formatNumber(value, 8));
    } else if (conversionType === "x") {
        return handleWidth(formatNumber(value, 16));
    } else if (conversionType === "X") {
        return handleWidth(formatNumber(value, 16)).toUpperCase();
    } else if (conversionType === "f" || conversionType === "F" || conversionType === "e" || conversionType === "E" || conversionType === "g" || conversionType === "G") {
        convValue = Sk.builtin.asnum$(value);
        if (typeof convValue === "string") {
            convValue = Number(convValue);
        }
        if (convValue === Infinity) {
            return "inf";
        }
        if (convValue === -Infinity) {
            return "-inf";
        }
        if (isNaN(convValue)) {
            return "nan";
        }
        convName = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(conversionType.toLowerCase())];
        if (precision === undefined || precision === "") {
            if (conversionType === "e" || conversionType === "E") {
                precision = 6;
            } else if (conversionType === "f" || conversionType === "F") {
                precision = 7;
            }
        }
        result = (convValue)[convName](precision); // possible loose of negative zero sign

        // apply sign to negative zeros, floats only!
        if(Sk.builtin.checkFloat(value)) {
            if(convValue === 0 && 1/convValue === -Infinity) {
                result = "-" + result; // add sign for zero
            }
        }

        if ("EFG".indexOf(conversionType) !== -1) {
            result = result.toUpperCase();
        }
        return handleWidth(["", result]);
    } else if (conversionType === "c") {
        if (typeof value === "number") {
            return String.fromCharCode(value);
        } else if (value instanceof Sk.builtin.int_) {
            return String.fromCharCode(value.v);
        } else if (value instanceof Sk.builtin.float_) {
            return String.fromCharCode(value.v);
        } else if (value instanceof Sk.builtin.lng) {
            return String.fromCharCode(value.str$(10, false)[0]);
        } else if (value.constructor === Sk.builtin.str) {
            return value.v.substr(0, 1);
        } else {
            throw new Sk.builtin.TypeError("an integer is required");
        }
    } else if (conversionType === "r") {
        r = Sk.builtin.repr(value);
        if (precision) {
            return r.v.substr(0, precision);
        }
        return r.v;
    } else if (conversionType === "s") {
        r = new Sk.builtin.str(value);
        if (precision) {
            return r.v.substr(0, precision);
        }
        if(fieldWidth) {
            r.v = handleWidth([" ", r.v]);
        }
        return r.v;
    } else if (conversionType === "%") {
        return "%";
    }
};
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // building our query
  filter() {
    // 1A)Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => {
      delete queryObj[el];
    });
    // here we are creating another same new object using spread operator
    // and then deleting each field that is in excludedFields
    // 1B)Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, matchedWord => {
      return `$${matchedWord}`;
    });
    // here we are replacing gte|gt|lte|lt with $gte|$gt|$lte|$lt because in mongoose it exists like this
    //  \b match return the exact words that is in between that operator(\b) while g flag specifies that the replace option
    //  will happen for all matched expression that is present in queryObj
    // if we remove g flag from there then it would mean that it will replace only the first matched expression
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // example of query in url:127.0.0.1:8000/api/v1/tours?sort=price
    //    req.query.sort=price
    //    this will sort by price in ascending order and
    //   for descending query will be like 127.0.0.1:8000/api/v1/tours?sort=-price
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      // this method will only show selected fields in your URL
      //  example is 127.0.0.1:8000/api/v1/tours?fields=name,duration,price,difficulty
    } else {
      this.query = this.query.select('-__v');
      // this will show every field except the mentioned one (if you will use minus sign before fields)
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    // this is the default value of page number and the limit that should be shown to the users
    const skip = (page - 1) * limit; //this variable contains number of pages that should be skipped
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

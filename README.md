# Employee Attendance Portal

Angular frontend for [EmployeeAttendancePortalApi](https://github.com/sowmyareddy14/EmployeeAttendancePortalApi).

## API contract

The app calls the hosted API at `http://skorg.runasp.net/api/EmployeeAttendance`. It uses the API's numeric attendance enum:

- `0` Present
- `1` Absent
- `2` Leave
- `3` Remote

## Run

```bash
npm install
npm start
```

The app requires the hosted API to allow the frontend origin through CORS.

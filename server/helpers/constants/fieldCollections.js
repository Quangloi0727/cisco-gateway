module.exports = {
    FIELD_AGENT: {
        getName: {
            title: "Tiêu đề",
            content: "Nội dung",
            dbVer: "Phiên bản",
        },
        require: ["content"],
        checkExists: [],
    },
    FIELD_IVR_HISTORIES: {
        getName: {
            ternalID: "id dự án",
            code: "Mã IVR",
            RouterCallKey: "Mã cuộc gọi",
            RouterCallKeyDay: "Mã cuộc gọi trong ngày",
            PhoneNumber: "SĐT khách hàng",
        },
        require: ["ternalID", "code", "RouterCallKey", "RouterCallKeyDay", "PhoneNumber"],
        checkExists: [],
    },
    CUSTOMER_REVIEWS: {
        getName: {
            ternalID: "id dự án",
            CallGUIDCustomize: "CallGUIDCustomize",
            startDate: "Ngày bắt đầu",
            endDate: "Ngày kết thúc",
        },
        require: ["ternalID", "CallGUIDCustomize", "startDate", "endDate"],
        checkExists: [],
    },
    FIELD_IVR_PROGRESS: {
        getName: {
            ternalID: "id dự án",
            code: "Vị trí IVR",
            RouterCallKey: "Mã cuộc gọi",
            RouterCallKeyDay: "Mã cuộc gọi trong ngày",
            PhoneNumber: "SĐT khách hàng",
        },
        require: ["ternalID", "code", "RouterCallKey", "RouterCallKeyDay", "PhoneNumber"],
        checkExists: [],
    },
};

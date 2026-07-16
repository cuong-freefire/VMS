import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient();

async function main() {
    console.log("UC21 seed start...");
    const vh = await bcrypt.hash("123456", 12);
    const sh = await bcrypt.hash("123456", 12);
    const vu = await p.user.upsert({where:{email:"volunteer@test.com"},update:{},create:{email:"volunteer@test.com",passwordHash:vh,fullName:"Nguyen Van A",phone:"0987654321",roleId:1,isActive:true,emailVerified:true}});
    const su = await p.user.upsert({where:{email:"staff@test.com"},update:{},create:{email:"staff@test.com",passwordHash:sh,fullName:"Tran Thi B",phone:"0912345678",roleId:2,isActive:true,emailVerified:true}});
    console.log("Users: v=" + vu.id + " s=" + su.id);
    const cat = await p.eventCategory.upsert({where:{name_categoryType:{name:"Moi truong",categoryType:"TYPE"}},update:{},create:{name:"Moi truong",categoryType:"TYPE",description:"Su kien moi truong",isActive:true}});

    const ed = [
        {t:"Don rac bai bien Vung Tau", d:"Don rac", l:"Bai Sau, Vung Tau", s:"2025-06-15T08:00:00Z", e:"2025-06-15T17:00:00Z", a:"2025-06-10T23:59:59Z", c:50},
        {t:"Trong cay gay rung Can Gio", d:"Trong 1000 cay.", l:"Can Gio, TPHCM", s:"2025-07-10T07:00:00Z", e:"2025-07-10T16:00:00Z", a:"2025-07-05T23:59:59Z", c:100},
        {t:"Phat do an tu thien", d:"Phat 500 phan com.", l:"Quan 1, TPHCM", s:"2025-03-15T06:00:00Z", e:"2025-03-15T12:00:00Z", a:"2025-03-10T23:59:59Z", c:30},
        {t:"Hien mau nhan dao", d:"Hien mau.", l:"Benh vien Cho Ray", s:"2024-12-01T08:00:00Z", e:"2024-12-01T16:00:00Z", a:"2024-11-28T23:59:59Z", c:80},
        {t:"Day hoc mien phi cho tre em", d:"Day tieng Anh.", l:"Mai am Thien Phuoc, Binh Thanh", s:"2026-02-20T08:00:00Z", e:"2026-02-20T17:00:00Z", a:"2026-02-15T23:59:59Z", c:20}
    ];

    const evts = [];
    for (const d of ed) {
        let e = await p.event.findFirst({where:{title:d.t}});
        if (!e) e = await p.event.create({data:{title:d.t, description:d.d, location:d.l, startDate:new Date(d.s), endDate:new Date(d.e), applicationDeadline:new Date(d.a), maxCapacity:d.c, categoryId:cat.id, createdBy:su.id, status:"PUBLISHED"}});
        evts.push(e);
    }
    console.log(evts.length + " events seeded");

    const ss = ["APPROVED", "PENDING", "REJECTED", "CANCELLED", "APPROVED"];
    for (let i = 0; i < evts.length; i++) {
        await p.application.upsert({where:{userId_eventId:{userId:vu.id, eventId:evts[i].id}}, update:{status:ss[i]}, create:{userId:vu.id, eventId:evts[i].id, status:ss[i], message:"Toi muon tham gia."}});
    }
    console.log(ss.length + " applications seeded (" + ss.join(",") + ")");
    console.log("UC021 seed done.");
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>p["$disconnect"]());

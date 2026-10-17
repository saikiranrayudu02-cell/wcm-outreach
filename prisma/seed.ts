import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive WCM Ministry database seeding...");

  // 1. Define complete list of users across all 4 roles
  const usersToCreate = [
    {
      username: "admin",
      password: "Password@123",
      role: "ADMIN",
      name: "Rev. Dr. David Raj",
      email: "admin@wmlrs.com",
      phoneNumber: "+91 98480 12345",
      state: "National Headquarters",
      zone: "Central",
      part: "HQ",
    },
    {
      username: "state_ap",
      password: "Password@123",
      role: "STATE_LEADER",
      name: "Pastor Abraham Lincoln",
      email: "state_ap@wmlrs.com",
      phoneNumber: "+91 98480 34567",
      state: "AP",
      zone: "Zone-1",
      part: "State Oversight",
    },
    {
      username: "state_ts",
      password: "Password@123",
      role: "STATE_LEADER",
      name: "Pastor P. Joshua",
      email: "state_ts@wmlrs.com",
      phoneNumber: "+91 98480 34568",
      state: "Telangana",
      zone: "Zone-2",
      part: "State Oversight",
    },
    {
      username: "zone_1",
      password: "Password@123",
      role: "ZONE_LEADER",
      name: "Pastor Moses Paul",
      email: "zone_1@wmlrs.com",
      phoneNumber: "+91 98480 45678",
      state: "AP",
      zone: "Zone-1",
      part: "Coastal Andhra",
    },
    {
      username: "zone_2",
      password: "Password@123",
      role: "ZONE_LEADER",
      name: "Pastor D. Emmanuel",
      email: "zone_2@wmlrs.com",
      phoneNumber: "+91 98480 45679",
      state: "Telangana",
      zone: "Zone-2",
      part: "Greater Hyderabad",
    },
    {
      username: "leader_john",
      password: "Password@123",
      role: "COORDINATOR",
      name: "Evangelist John Wesley",
      email: "john@wmlrs.com",
      phoneNumber: "+91 98480 23456",
      state: "AP",
      part: "Part-1",
      zone: "Zone-1",
    },
    {
      username: "coord_matthew",
      password: "Password@123",
      role: "COORDINATOR",
      name: "Evangelist Matthew Luke",
      email: "matthew@wmlrs.com",
      phoneNumber: "+91 98480 23457",
      state: "AP",
      part: "Part-2",
      zone: "Zone-1",
    },
    {
      username: "coord_samuel",
      password: "Password@123",
      role: "COORDINATOR",
      name: "Evangelist K. Samuel",
      email: "samuel@wmlrs.com",
      phoneNumber: "+91 98480 23458",
      state: "Telangana",
      part: "Part-1",
      zone: "Zone-2",
    },
    {
      username: "coord_paul",
      password: "Password@123",
      role: "COORDINATOR",
      name: "Evangelist Paul Timothy",
      email: "paul@wmlrs.com",
      phoneNumber: "+91 98480 23459",
      state: "AP",
      part: "Part-3",
      zone: "Zone-1",
    },
    {
      username: "coord_daniel",
      password: "Password@123",
      role: "COORDINATOR",
      name: "Evangelist Daniel Thomas",
      email: "daniel@wmlrs.com",
      phoneNumber: "+91 98480 23460",
      state: "Karnataka",
      part: "Part-1",
      zone: "Zone-3",
    },
  ];

  const createdUserMap: Record<string, any> = {};

  for (const u of usersToCreate) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    let user = await prisma.user.findUnique({
      where: { username: u.username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: u.username,
          passwordHash: passwordHash,
          role: u.role as any,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          emailVerified: true,
          state: u.state || null,
          part: u.part || null,
          zone: u.zone || null,
        },
      });

      // Create corresponding Better Auth Account
      await prisma.account.create({
        data: {
          accountId: u.email,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✓ Created user: ${u.username} (${u.role})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: u.name,
          phoneNumber: u.phoneNumber,
          state: u.state || null,
          part: u.part || null,
          zone: u.zone || null,
          role: u.role as any,
        },
      });
      console.log(`✓ Synchronized user: ${u.username} (${u.role})`);
    }
    createdUserMap[u.username] = user;
  }

  const john = createdUserMap["leader_john"];
  const matthew = createdUserMap["coord_matthew"];
  const samuel = createdUserMap["coord_samuel"];
  const zone1 = createdUserMap["zone_1"];
  const admin = createdUserMap["admin"];

  // 2. Clear old demo reports to prevent duplicates on multiple runs
  await prisma.reviewerComment.deleteMany();
  await prisma.reportAuditLog.deleteMany();
  await prisma.verificationSheet.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.afterMeetingReport.deleteMany();
  await prisma.meetingReport.deleteMany();
  await prisma.meetingConfirmation.deleteMany();
  await prisma.notification.deleteMany();

  console.log("🧹 Cleaned old demo reports and notifications for fresh seed.");

  // 3. Seed Comprehensive Meeting Reports with Realistic Data across 2026
  const sampleReports = [
    {
      reportId: "MR-2026-0001",
      leaderId: john.id,
      status: "APPROVED",
      version: 1,
      submittedAt: new Date("2026-10-04T18:30:00Z"),
      verification: {
        convenerName: "Pastor G. Prabhakar Rao",
        churchMinistryName: "Grace Tabernacle Assemblies",
        stateDistrictCity: "AP, Krishna, Vijayawada",
        contactNumber: "+91 98491 55667",
        meetingDates: "Oct 2-4, 2026",
        numberOfDays: 3,
        expectedAttendance: 500,
        yearsOfMinistry: 18,
        churchMembers: 350,
        workersLeaders: 25,
        knowAboutWcm: "YouTube Sermons by Prophet Kiran",
        readWcmBooks: true,
        attendedProphetMeeting: true,
        meetingHallStage: "Excellent - Elevated platform with LED backdrop",
        soundSystem: "Arranged By Host (Digital Line Array)",
        accommodationTeam: "Arranged By Host (Guest House)",
        volunteerSupport: "Strong (30 active youth volunteers)",
      },
      attendance: {
        date: new Date("2026-10-04"),
        location: "Grace Tabernacle, Auto Nagar, Vijayawada",
        fieldExecuter: "Prophet Kiran & Ministry Team",
        coordinator: "Evangelist John Wesley",
        membersAttended: 485,
        pastorsAttended: 24,
        remarks: "Massive Holy Spirit outpouring. 48 souls accepted Christ and received salvation prayer.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Supernatural breakthrough, multi-church revival and exceptional local congregation cooperation.",
        congregationResponse: "Deeply touched, tearful prayers and requested permanent annual convention.",
        continueFellowship: true,
        futureOpportunities: ["Monthly Meeting", "Youth Meeting", "Pastors Conference", "Night Vigil"],
        localChurchInfluence: "High - Well respected across Krishna district",
        networkOfPastors: "Strong association of 40+ local independent churches",
        strengthsObserved: "Punctual arrangements, disciplined ushering, high spiritual hunger",
        challengesObserved: "Parking space was limited due to overwhelming crowd on final night",
        opportunityForWcm: "Pastor Prabhakar offered the auditorium for regional WCM youth crusades",
        coordinatorName: "Evangelist John Wesley",
        designation: "Zonal Outreach Coordinator",
        signature: "John Wesley",
        submissionDate: new Date("2026-10-05"),
        followingWcmMembersCount: 112,
      },
      audit: [
        { actorId: john.id, action: "REPORT_SUBMITTED", details: "Report submitted by Evangelist John Wesley" },
        { actorId: zone1.id, action: "REPORT_APPROVED", details: "Approved by Zone 1 Leader Pastor Moses Paul" },
        { actorId: admin.id, action: "REPORT_FINALIZED", details: "Finalized and archived by Central Administration" },
      ],
    },
    {
      reportId: "MR-2026-0002",
      leaderId: john.id,
      status: "APPROVED",
      version: 1,
      submittedAt: new Date("2026-10-11T19:00:00Z"),
      verification: {
        convenerName: "Pastor K. Samuel Raj",
        churchMinistryName: "Bethesda Prayer House",
        stateDistrictCity: "AP, Guntur, Arundelpet",
        contactNumber: "+91 94401 22334",
        meetingDates: "Oct 10-11, 2026",
        numberOfDays: 2,
        expectedAttendance: 350,
        yearsOfMinistry: 12,
        churchMembers: 220,
        workersLeaders: 16,
        knowAboutWcm: "Book: Secrets of Prophetic Ministry",
        readWcmBooks: true,
        attendedProphetMeeting: false,
        meetingHallStage: "Good - Well air-conditioned indoor hall",
        soundSystem: "Arranged By Host (Good acoustics)",
        accommodationTeam: "Arranged By Host",
        volunteerSupport: "Medium (15 church volunteers)",
      },
      attendance: {
        date: new Date("2026-10-11"),
        location: "Bethesda Prayer House, Arundelpet, Guntur",
        fieldExecuter: "WCM Gospel Outreach Team",
        coordinator: "Evangelist John Wesley",
        membersAttended: 340,
        pastorsAttended: 32,
        remarks: "Special pastors impartation session was conducted on Saturday afternoon.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Ministers were spiritually renewed and encouraged in their calling.",
        congregationResponse: "Warm reception and enthusiastic response to prophetic ministry.",
        continueFellowship: true,
        futureOpportunities: ["Pastor Meeting", "Fasting Prayer", "Special Event"],
        localChurchInfluence: "Medium - Strong in city center",
        networkOfPastors: "Connected with Guntur Pastors Fellowship",
        strengthsObserved: "Excellent hospitality and coordinated follow-up team",
        challengesObserved: "Rain on Saturday evening caused slight delay in opening service",
        opportunityForWcm: "Guntur Pastors Fellowship requested a 1-day leadership conference",
        coordinatorName: "Evangelist John Wesley",
        designation: "Zonal Outreach Coordinator",
        signature: "John Wesley",
        submissionDate: new Date("2026-10-12"),
        followingWcmMembersCount: 78,
      },
      audit: [
        { actorId: john.id, action: "REPORT_SUBMITTED", details: "Report submitted by Evangelist John Wesley" },
        { actorId: zone1.id, action: "REPORT_APPROVED", details: "Approved by Zone 1 Leader Pastor Moses Paul" },
      ],
    },
    {
      reportId: "MR-2026-0003",
      leaderId: matthew.id,
      status: "ZONE_LEADER_REVIEW",
      version: 1,
      submittedAt: new Date("2026-10-15T14:20:00Z"),
      verification: {
        convenerName: "Pastor T. Joshua",
        churchMinistryName: "Calvary Revival Church",
        stateDistrictCity: "AP, Guntur, Tenali",
        contactNumber: "+91 98850 77889",
        meetingDates: "Oct 14-15, 2026",
        numberOfDays: 2,
        expectedAttendance: 300,
        yearsOfMinistry: 9,
        churchMembers: 180,
        workersLeaders: 12,
        knowAboutWcm: "Fellowship Pastor Recommendation",
        readWcmBooks: true,
        attendedProphetMeeting: true,
        meetingHallStage: "Arranged By Host (Outdoor Pandal)",
        soundSystem: "Arranged By Host (Outdoor Horn & Box)",
        accommodationTeam: "Arranged By Host",
        volunteerSupport: "Strong",
      },
      attendance: {
        date: new Date("2026-10-15"),
        location: "Calvary Revival Church Grounds, Tenali",
        fieldExecuter: "WCM Field Outreach Team",
        coordinator: "Evangelist Matthew Luke",
        membersAttended: 295,
        pastorsAttended: 14,
        remarks: "Powerful evening crusade. Many sick received healing prayer.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Town-wide gospel impact with several young people coming forward for ministry dedication.",
        congregationResponse: "Eager for future crusade dates.",
        continueFellowship: true,
        futureOpportunities: ["Youth Meeting", "Night Vigil", "Monthly Meeting"],
        localChurchInfluence: "High in surrounding villages",
        networkOfPastors: "Tenali Christian Ministers Association",
        strengthsObserved: "Vibrant worship team and enthusiastic youth participation",
        challengesObserved: "Generator needed due to power fluctuations in rural grid",
        opportunityForWcm: "Potential for planting a monthly prayer fellowship in Tenali",
        coordinatorName: "Evangelist Matthew Luke",
        designation: "Outreach Coordinator",
        signature: "Matthew Luke",
        submissionDate: new Date("2026-10-15"),
        followingWcmMembersCount: 64,
      },
      audit: [
        { actorId: matthew.id, action: "REPORT_SUBMITTED", details: "Submitted and awaiting Zone Leader review" },
      ],
    },
    {
      reportId: "MR-2026-0004",
      leaderId: john.id,
      status: "REQUEST_CHANGES",
      requestedChangesBy: "ZONE",
      version: 1,
      submittedAt: new Date("2026-10-13T11:00:00Z"),
      verification: {
        convenerName: "Pastor B. Devadas",
        churchMinistryName: "Sharon Gospel Center",
        stateDistrictCity: "AP, West Godavari, Eluru",
        contactNumber: "+91 99480 33445",
        meetingDates: "Oct 12, 2026",
        numberOfDays: 1,
        expectedAttendance: 250,
        yearsOfMinistry: 15,
        churchMembers: 200,
        workersLeaders: 14,
        knowAboutWcm: "WCM TV Broadcast",
        readWcmBooks: false,
        attendedProphetMeeting: false,
        meetingHallStage: "Good Stage",
        soundSystem: "Good Sound",
        accommodationTeam: "Arranged",
        volunteerSupport: "Medium",
      },
      attendance: {
        date: new Date("2026-10-12"),
        location: "Sharon Gospel Center, Sanivarapupeta, Eluru",
        fieldExecuter: "Evangelist John Wesley",
        coordinator: "Evangelist John Wesley",
        membersAttended: 210,
        pastorsAttended: 8,
        remarks: "1-day revival meeting held.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Hearty fellowship and spiritual renewal.",
        congregationResponse: "Warm and receptive.",
        continueFellowship: true,
        futureOpportunities: ["Monthly Meeting"],
        localChurchInfluence: "Medium",
        networkOfPastors: "Local Eluru Pastors Fellowship",
        strengthsObserved: "Cooperative leadership",
        challengesObserved: "Short preparation notice",
        opportunityForWcm: "Follow-up book distribution requested",
        coordinatorName: "Evangelist John Wesley",
        designation: "Outreach Coordinator",
        signature: "John Wesley",
        submissionDate: new Date("2026-10-13"),
        followingWcmMembersCount: 35,
      },
      audit: [
        { actorId: john.id, action: "REPORT_SUBMITTED", details: "Initial draft submitted" },
        { actorId: zone1.id, action: "REQUEST_CHANGES", details: "Changes requested by Zone Leader" },
      ],
      comment: {
        reviewerId: zone1.id,
        comment: "Please provide the complete names and phone numbers of the 8 visiting pastors who attended so our central follow-up office can mail them literature.",
      },
    },
    {
      reportId: "MR-2026-0005",
      leaderId: john.id,
      status: "DRAFT",
      version: 1,
      submittedAt: null,
      verification: {
        convenerName: "Pastor M. Caleb",
        churchMinistryName: "Zion Worship Center",
        stateDistrictCity: "AP, Guntur, Mangalagiri",
        contactNumber: "+91 97000 11223",
        meetingDates: "Oct 24-25, 2026",
        numberOfDays: 2,
        expectedAttendance: 250,
        yearsOfMinistry: 7,
        churchMembers: 160,
        workersLeaders: 10,
        knowAboutWcm: "YouTube",
        readWcmBooks: true,
        attendedProphetMeeting: false,
        meetingHallStage: "Arranged By Host",
        soundSystem: "Arranged By Host",
        accommodationTeam: "Arranged By Host",
        volunteerSupport: "Strong",
      },
      attendance: null,
      afterMeeting: null,
      audit: [
        { actorId: john.id, action: "DRAFT_CREATED", details: "Draft initialized for upcoming outreach" },
      ],
    },
    {
      reportId: "MR-2026-0006",
      leaderId: samuel.id,
      status: "APPROVED",
      version: 1,
      submittedAt: new Date("2026-09-20T17:00:00Z"),
      verification: {
        convenerName: "Rev. Dr. S. K. Daniel",
        churchMinistryName: "Emmanuel Full Gospel Cathedral",
        stateDistrictCity: "Telangana, Hyderabad, Secunderabad",
        contactNumber: "+91 98490 88990",
        meetingDates: "Sep 18-20, 2026",
        numberOfDays: 3,
        expectedAttendance: 800,
        yearsOfMinistry: 25,
        churchMembers: 600,
        workersLeaders: 45,
        knowAboutWcm: "Prophet Kiran Ministry Outreach Alliance",
        readWcmBooks: true,
        attendedProphetMeeting: true,
        meetingHallStage: "Excellent AC Auditorium with 1,000 capacity",
        soundSystem: "Professional JBL Concert Audio",
        accommodationTeam: "Hotel Arranged By Host",
        volunteerSupport: "Very Strong (50 dedicated stewards)",
      },
      attendance: {
        date: new Date("2026-09-20"),
        location: "Emmanuel Cathedral, Paradise Circle, Secunderabad",
        fieldExecuter: "Prophet Kiran & State Ministry Leaders",
        coordinator: "Evangelist K. Samuel",
        membersAttended: 820,
        pastorsAttended: 48,
        remarks: "Historic multi-denominational ministers summit and evening public miracle crusade.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Unprecedented unity among Hyderabad city churches with massive attendance.",
        congregationResponse: "Overflowing joy, numerous miracle testimonies, standing ovations.",
        continueFellowship: true,
        futureOpportunities: ["Pastor Meeting", "Youth Meeting", "Special Event", "Night Vigil"],
        localChurchInfluence: "Highest - Metropolitan flagship cathedral",
        networkOfPastors: "Hyderabad Christian Leaders Forum (150+ churches)",
        strengthsObserved: "Flawless organization, powerful translation, state-of-the-art media setup",
        challengesObserved: "Overcrowded auditorium required overflow screens in lower hall",
        opportunityForWcm: "Secunderabad forum requested quarterly regional prophetic conference",
        coordinatorName: "Evangelist K. Samuel",
        designation: "Telangana Zonal Coordinator",
        signature: "K. Samuel",
        submissionDate: new Date("2026-09-21"),
        followingWcmMembersCount: 240,
      },
      audit: [
        { actorId: samuel.id, action: "REPORT_SUBMITTED", details: "Submitted by Evangelist K. Samuel" },
        { actorId: admin.id, action: "REPORT_APPROVED", details: "Approved and finalized by Central Admin" },
      ],
    },
    {
      reportId: "MR-2026-0007",
      leaderId: john.id,
      status: "APPROVED",
      version: 1,
      submittedAt: new Date("2026-08-16T18:00:00Z"),
      verification: {
        convenerName: "Pastor P. Anand Kumar",
        churchMinistryName: "New Life Worship Center",
        stateDistrictCity: "AP, East Godavari, Rajahmundry",
        contactNumber: "+91 94405 66778",
        meetingDates: "Aug 14-16, 2026",
        numberOfDays: 3,
        expectedAttendance: 600,
        yearsOfMinistry: 20,
        churchMembers: 400,
        workersLeaders: 30,
        knowAboutWcm: "WCM Conferences in Visakhapatnam",
        readWcmBooks: true,
        attendedProphetMeeting: true,
        meetingHallStage: "Grand Open Ground Pandal with LED screens",
        soundSystem: "High Quality Arena Audio",
        accommodationTeam: "Arranged in Church Guest House",
        volunteerSupport: "Strong",
      },
      attendance: {
        date: new Date("2026-08-16"),
        location: "New Life Ground, Danavaipeta, Rajahmundry",
        fieldExecuter: "Prophet Kiran & Ministry Team",
        coordinator: "Evangelist John Wesley",
        membersAttended: 610,
        pastorsAttended: 36,
        remarks: "Deep spiritual revival across East Godavari district churches.",
      },
      afterMeeting: {
        overallMeetingOutcome: "Powerful spiritual hunger, healing manifestations and strong ministerial alliances.",
        congregationResponse: "Tremendous eagerness for WCM prophetic literature.",
        continueFellowship: true,
        futureOpportunities: ["Monthly Meeting", "Women Meeting", "Pastors Conference"],
        localChurchInfluence: "High throughout Godavari delta",
        networkOfPastors: "Godavari Pastors Council",
        strengthsObserved: "Excellent inter-church cooperation across denominations",
        challengesObserved: "Humid coastal weather; fans needed upgrading",
        opportunityForWcm: "Invited to conduct annual summer crusade in Godavari belt",
        coordinatorName: "Evangelist John Wesley",
        designation: "Zonal Outreach Coordinator",
        signature: "John Wesley",
        submissionDate: new Date("2026-08-17"),
        followingWcmMembersCount: 165,
      },
      audit: [
        { actorId: john.id, action: "REPORT_SUBMITTED", details: "Submitted by Evangelist John Wesley" },
        { actorId: zone1.id, action: "REPORT_APPROVED", details: "Approved by Zone 1 Leader" },
        { actorId: admin.id, action: "REPORT_APPROVED", details: "Approved by Admin" },
      ],
    },
  ];

  for (const r of sampleReports) {
    const report = await prisma.meetingReport.create({
      data: {
        reportId: r.reportId,
        leaderId: r.leaderId,
        status: r.status as any,
        version: r.version,
        submittedAt: r.submittedAt,
        requestedChangesBy: (r as any).requestedChangesBy || null,
      },
    });

    if (r.verification) {
      await prisma.verificationSheet.create({
        data: {
          meetingReportId: report.id,
          ...r.verification,
        },
      });
    }

    if (r.attendance) {
      await prisma.attendanceRecord.create({
        data: {
          meetingReportId: report.id,
          ...r.attendance,
        },
      });
    }

    if (r.afterMeeting) {
      await prisma.afterMeetingReport.create({
        data: {
          meetingReportId: report.id,
          ...r.afterMeeting,
        },
      });
    }

    if (r.audit) {
      for (const a of r.audit) {
        await prisma.reportAuditLog.create({
          data: {
            meetingReportId: report.id,
            actorId: a.actorId,
            action: a.action,
            details: a.details,
          },
        });
      }
    }

    if ((r as any).comment) {
      await prisma.reviewerComment.create({
        data: {
          meetingReportId: report.id,
          reviewerId: (r as any).comment.reviewerId,
          comment: (r as any).comment.comment,
        },
      });
    }

    console.log(`✓ Seeded report: ${r.reportId} [${r.status}]`);
  }

  // 4. Seed Meeting Confirmations / Upcoming Proposals
  const sampleConfirmations = [
    {
      leaderId: john.id,
      location: "St. John's Community Center, Arundelpet, Guntur",
      meetingDates: "Nov 14-16, 2026",
      expectedAttendance: 400,
      message: "Proposed 3-day youth convention with 5 local partner churches. Pastor David has confirmed stage readiness.",
      status: "APPROVED",
      adminFeedback: "Approved. Audio team travel has been sanctioned from headquarters. Coordinate with Zone 1 leader.",
    },
    {
      leaderId: john.id,
      location: "City Light Convention Hall, Benz Circle, Vijayawada",
      meetingDates: "Dec 5-7, 2026",
      expectedAttendance: 600,
      message: "Annual Advent revival crusade. We are expecting delegates from across Krishna and Guntur districts.",
      status: "PENDING",
      adminFeedback: null,
    },
    {
      leaderId: matthew.id,
      location: "Bethany Gospel Center, Lawyerpet, Ongole",
      meetingDates: "Nov 28-29, 2026",
      expectedAttendance: 300,
      message: "2-day weekend faith conference. Pastor Anand is hosting the ministry team in church guest rooms.",
      status: "APPROVED",
      adminFeedback: "Approved. Please ensure book distribution stall is arranged near the entrance.",
    },
    {
      leaderId: samuel.id,
      location: "Emmanuel Prayer Mountain, Shamirpet, Hyderabad",
      meetingDates: "Dec 18-20, 2026",
      expectedAttendance: 750,
      message: "Statewide year-end fasting prayer convention for Telangana pastors and youth leaders.",
      status: "PENDING",
      adminFeedback: null,
    },
  ];

  for (const c of sampleConfirmations) {
    await prisma.meetingConfirmation.create({
      data: c,
    });
  }
  console.log(`✓ Seeded ${sampleConfirmations.length} upcoming meeting proposals.`);

  // 5. Seed Announcements and Notifications
  const sampleNotifications = [
    {
      senderId: admin.id,
      recipientId: john.id,
      title: "Annual Ministry Leadership Conference 2026",
      message: "All Outreach Coordinators are requested to attend the Annual Review Summit at WCM Central Headquarters from December 12th-14th. Travel allowances will be reimbursed.",
      read: false,
    },
    {
      senderId: zone1.id,
      recipientId: john.id,
      title: "Notice: Monthly Report Submission Deadline",
      message: "Please ensure all reports for October outreach meetings are submitted by October 25th for compilation in the quarterly report.",
      read: true,
    },
    {
      senderId: admin.id,
      recipientId: matthew.id,
      title: "Literature Stall Guidelines for Crusades",
      message: "New shipments of Prophet Kiran's Telugu & English books have arrived at the regional depot. Contact your Zone Leader to collect outreach inventory.",
      read: false,
    },
    {
      senderId: admin.id,
      recipientId: samuel.id,
      title: "Welcome to WCM Telangana Zonal Team",
      message: "Greetings Evangelist Samuel. Your coordinator credentials have been activated for the Greater Hyderabad territory.",
      read: true,
    },
  ];

  for (const n of sampleNotifications) {
    await prisma.notification.create({
      data: n,
    });
  }
  console.log(`✓ Seeded ${sampleNotifications.length} ministry announcements and direct notifications.`);

  console.log("\n🎉 Database successfully populated with realistic example data across all 4 roles!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# Roles:

## Admin:
- can add/update course providers. [core service]
- remove trainees (with a reason). [core service]
- access the admin dashboard. [core service]
- all trainees data access(readonly). [core service]
- all course providers data access (readonly). [core service]

## Course provider:
- can add/remove/update courses. [core service]
- can kick trainees. (must give a reason). [core service]
- all trainees data access (readonly). [core service]
- suggestions on course improvement based on current market demand. [AI service]
- chat bot for course providers, for further discussion. [AI service]
- They can't register like trainees, they have to fill their information, put their login credentials (email and password), and sublit it to admin, admin would verify their application and allow them to create an account. [core service]

## Trainees:
- add/modify/delete their information. [core service]
- has list of skills, earned through completing courses that teaches those skills. [core service]
- has certifications earned through completing courses. [core service]
- has employment status, current role, current salary, and salary groth. [core service]
- follow up history. [core service]
- change consent status. [email/core service]
- enrol or drop out of courses. (if dropping must give a reason) [core service]
- upload resume, mention job role/title for skill gap analysis. [AI service]
- ats system for trainees, which would also help in skill gap analysis, it would extract skills and turn them into tokens. [AI service]
- can request to remove their employment information or to keep the information but forbid to send further emails. [email/core service]

---

# Skill-Track services:

## **Core service:**
- List all the trainees -> Click on them to go to their profiles.
- List all the course provider(s) -> List all their courses (drop down).
- List all the skills -> Trainees enrolled (how many + names).
- Each trainee would have their separate accounts with their information (skills, certifications, courses enrolled, courses complied, projects done and their repo link, employment status, where do they work, current job role, salary progression, follow up information, personal information).
- Show how many students got job.
- Show how many students did not get job and why?


## **AI service: (limited to IT roles)**

### Market research:
- All the market research would be kept in documents inside a repository. 
- Gets current market data from trusted online sources, updates the documentations in it's repository.

### Skill Gap:
Upload resume -> Tell your target role -> AI tells your skill gaps.

### Skill based match making:
AI tells you what kind of role is suitable for you based on your skills.

### Suggesting future career:
- Career trends.
- New careers that might emerge in future.
- Future career prospect in a certain role.
- Changes in a certain role (in skills or even overall).

### Suggest changes in courses:
- Suggest changes in courses based in current market trends/needs.
- New course ideas.

## **Email service:**
- Send and email in every 3 months to the trainees/users to fill/update information.
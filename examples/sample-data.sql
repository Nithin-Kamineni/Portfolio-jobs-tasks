-- Sample data to try the Tasks app (safe to delete in the app afterwards).
-- cd site && npx wrangler d1 execute DB --local --file ../examples/sample-data.sql
INSERT INTO docs(title,content,text,created_at,updated_at) VALUES('Welcome',
 '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome"}]},{"type":"paragraph","content":[{"type":"text","text":"Type 1. or - to start a list. Select lines and press Checklist for tick boxes; give them a date with the calendar button."}]},{"type":"taskList","content":[{"type":"taskItem","attrs":{"checked":false,"due":null},"content":[{"type":"paragraph","content":[{"type":"text","text":"Fill in my profile"}]}]},{"type":"taskItem","attrs":{"checked":false,"due":null},"content":[{"type":"paragraph","content":[{"type":"text","text":"Pick the parts I want to build"}]}]}]}]}',
 'Welcome Type 1. or - to start a list. Select lines and press Checklist for tick boxes; give them a date with the calendar button. Fill in my profile Pick the parts I want to build',
 '2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO papers(position,title,authors,venue,year,url,status,domains,notes,created_at,updated_at) VALUES
 (1,'Attention Is All You Need','A. Vaswani et al.','NeurIPS',2017,'https://arxiv.org/abs/1706.03762','to_read','["llm"]','','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
 (2,'In-Datacenter Performance Analysis of a Tensor Processing Unit','N. P. Jouppi et al.','ISCA',2017,'https://arxiv.org/abs/1704.04760','to_read','["accelerator"]','','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
 (3,'MapReduce: Simplified Data Processing on Large Clusters','J. Dean, S. Ghemawat','OSDI',2004,'https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/','to_read','[]','','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO deadlines(title,due_on,due_time,tz,kind,note,url,size,shown,source,created_at,updated_at) VALUES
 ('Example: application deadline', date('now','+21 days'), NULL, 'local', 'application', 'Sample data: edit or delete me', '', 'M', 1, 'manual', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

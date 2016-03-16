require 'csv'
require 'json'

last_year=0
last_month=0
last_day=0
i=0
readings=[]
CSV.foreach('adatok_v2.csv', return_headers: false) do |row|
  if i!=0
    current_reading={}
    current_year=0
    current_month=0
    current_day=0
    current_hour, current_min=row[1].split(":")
    if !row[0].nil? || !row[0]==""

      current_year, current_month, current_day=row[0].split(".")
      last_year,last_month,last_day=current_year, current_month, current_day
    else

      current_year, current_month, current_day=last_year, last_month, last_day
    end
    current_reading={
      dias: row[2].to_i,
      sys: row[3].to_i,
      pulse: row[4].to_i,
      timestamp: Time.new(current_year.to_i, current_month.to_i, current_day.to_i, current_hour.to_i, current_min.to_i, 0)
    }
    readings.push current_reading
  else
    i=i+1
  end
end
puts "var data=#{readings.to_json}"
